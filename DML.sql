USE ev_rental_db;

CREATE OR REPLACE VIEW v_StationVehicleCount AS
SELECT
    s.StationID,
    s.Name,
    s.Location,
    s.Capacity,
    COUNT(v.VehicleID) AS AvailableVehicles
FROM
    Stations s
LEFT JOIN
    Vehicles v ON s.StationID = v.CurrentStationID AND v.Status = 'available'
WHERE
    s.IsActive = TRUE
GROUP BY
    s.StationID, s.Name, s.Location, s.Capacity;

CREATE OR REPLACE VIEW v_VehicleDetails AS
SELECT
    v.VehicleID,
    v.RegistrationNumber,
    v.Type,
    v.Model,
    v.Manufacturer,
    v.RatePerHour,
    v.Status,
    s.Name AS CurrentStationName
FROM
    Vehicles v
LEFT JOIN
    Stations s ON v.CurrentStationID = s.StationID
WHERE
    v.Status != 'decommissioned';

CREATE OR REPLACE VIEW v_UserTripHistory AS
SELECT 
    t.TripID, t.UserID, u.Name AS UserName, v.Type AS VehicleType,
    s1.Name AS StartStation, s2.Name AS EndStation,
    t.StartTime, t.EndTime, t.Cost, t.Status
FROM Trips t
JOIN Users u ON t.UserID = u.UserID
JOIN Vehicles v ON t.VehicleID = v.VehicleID
JOIN Stations s1 ON t.StartStationID = s1.StationID
LEFT JOIN Stations s2 ON t.EndStationID = s2.StationID;

DROP PROCEDURE IF EXISTS sp_ReportAndAssignMaintenance;

DELIMITER $$

CREATE PROCEDURE sp_ReportAndAssignMaintenance(
    IN p_VehicleID INT,
    IN p_IssueReported TEXT
)
BEGIN
    DECLARE v_LogID INT;
    DECLARE v_TechnicianID INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE Vehicles
    SET Status = 'under-maintenance'
    WHERE VehicleID = p_VehicleID AND Status = 'available';

    INSERT INTO MaintenanceLogs (VehicleID, IssueReported, ReportedDate, Status)
    VALUES (p_VehicleID, p_IssueReported, CURDATE(), 'Pending');

    SET v_LogID = LAST_INSERT_ID();

    SELECT TechnicianID INTO v_TechnicianID
    FROM Technicians
    WHERE IsAvailable = TRUE
    ORDER BY ActiveAssignments ASC
    LIMIT 1;

    IF v_TechnicianID IS NOT NULL THEN
        INSERT INTO TechnicianAssignments (LogID, TechnicianID)
        VALUES (v_LogID, v_TechnicianID);

        UPDATE Technicians
        SET ActiveAssignments = ActiveAssignments + 1
        WHERE TechnicianID = v_TechnicianID;

        UPDATE MaintenanceLogs
        SET Status = 'In-Progress'
        WHERE LogID = v_LogID;
    END IF;

    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_CreateBooking;

DELIMITER //

CREATE PROCEDURE sp_CreateBooking(
    IN p_UserID INT,
    IN p_VehicleID INT,
    IN p_StartStationID INT,
    IN p_DurationHours DECIMAL(5,2)
)
BEGIN
    DECLARE v_rate, v_cost, v_balance DECIMAL(10,2);
    DECLARE v_discount DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_start_time, v_end_time DATETIME;

    START TRANSACTION;

    SELECT RatePerHour INTO v_rate
    FROM Vehicles
    WHERE VehicleID = p_VehicleID AND Status = 'available'
    FOR UPDATE;

    IF v_rate IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle not available';
    END IF;

    SELECT 
        CASE 
            WHEN mp.PlanName = 'Basic Plan' THEN 0.05
            WHEN mp.PlanName = 'Premium Plan' THEN 0.10
            WHEN mp.PlanName = 'Annual Plan' THEN 0.15
            ELSE 0.00
        END INTO v_discount
    FROM Users u
    LEFT JOIN MembershipPlans mp ON u.PlanID = mp.PlanID
    WHERE u.UserID = p_UserID;

    SET v_cost = (v_rate * p_DurationHours) * (1 - v_discount);

    SELECT WalletBalance INTO v_balance
    FROM Users
    WHERE UserID = p_UserID
    FOR UPDATE;

    IF v_balance < v_cost THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;

    SET v_start_time = NOW();
    SET v_end_time = DATE_ADD(v_start_time, INTERVAL p_DurationHours HOUR);

    INSERT INTO Trips(UserID, VehicleID, StartStationID, StartTime, EndTime, Cost, Status)
    VALUES(p_UserID, p_VehicleID, p_StartStationID, v_start_time, v_end_time, v_cost, 'Ongoing');

    UPDATE Vehicles
    SET Status = 'in-use'
    WHERE VehicleID = p_VehicleID;

    UPDATE Users
    SET WalletBalance = WalletBalance - v_cost
    WHERE UserID = p_UserID;

    INSERT INTO Payments(TripID, UserID, Amount, Status)
    VALUES(LAST_INSERT_ID(), p_UserID, v_cost, 'Success');

    COMMIT;
END //

DELIMITER ;
DROP PROCEDURE IF EXISTS sp_EndRide;
DELIMITER //

CREATE PROCEDURE sp_EndRide(
    IN p_TripID INT,
    IN p_EndStationID INT
)
BEGIN
    DECLARE v_vehicleID INT;
    START TRANSACTION;
    SELECT VehicleID INTO v_vehicleID FROM Trips WHERE TripID=p_TripID FOR UPDATE;
    UPDATE Trips
      SET EndTime=NOW(), EndStationID=p_EndStationID, Status='Completed'
      WHERE TripID=p_TripID;
    UPDATE Vehicles
      SET Status='available', CurrentStationID=p_EndStationID
      WHERE VehicleID=v_vehicleID;
    COMMIT;
END //

DELIMITER ;
DROP PROCEDURE IF EXISTS sp_CancelTrip;
DELIMITER $$

CREATE PROCEDURE sp_CancelTrip(
    IN p_TripID INT
)
BEGIN
    DECLARE v_VehicleID INT;
    DECLARE v_UserID INT;
    DECLARE v_Cost DECIMAL(10, 2);
    DECLARE v_TripStatus VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT VehicleID, UserID, Cost, Status
    INTO v_VehicleID, v_UserID, v_Cost, v_TripStatus
    FROM Trips
    WHERE TripID = p_TripID
    FOR UPDATE;

    IF v_TripStatus != 'Ongoing' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only ongoing trips can be cancelled';
    END IF;

    UPDATE Trips
    SET Status = 'Cancelled', EndTime = NOW()
    WHERE TripID = p_TripID;

    UPDATE Vehicles v
    JOIN Trips t ON v.VehicleID = t.VehicleID
    SET v.Status = 'available', v.CurrentStationID = t.StartStationID
    WHERE t.TripID = p_TripID;

    UPDATE Users
    SET WalletBalance = WalletBalance + v_Cost
    WHERE UserID = v_UserID;

    UPDATE Payments
    SET Status = 'Refunded'
    WHERE TripID = p_TripID AND UserID = v_UserID;

    COMMIT;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW v_TechnicianAssignments AS
SELECT
    ta.AssignmentID,
    ta.LogID,
    ta.TechnicianID,
    t.Name AS TechnicianName,
    t.Specialization,
    t.IsAvailable,
    t.ActiveAssignments,
    ml.VehicleID,
    v.RegistrationNumber,
    v.Model AS VehicleModel,
    v.Type AS VehicleType,
    ml.IssueReported,
    ml.ReportedDate,
    ml.Status AS LogStatus
FROM
    TechnicianAssignments ta
JOIN
    Technicians t ON ta.TechnicianID = t.TechnicianID
JOIN
    MaintenanceLogs ml ON ta.LogID = ml.LogID
JOIN
    Vehicles v ON ml.VehicleID = v.VehicleID;
