USE ev_rental_db;

ALTER TABLE `Stations`
ADD COLUMN `IsActive` BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE `Vehicles`
MODIFY COLUMN `Status` ENUM('available', 'in-use', 'under-maintenance', 'decommissioned') NOT NULL DEFAULT 'available';

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

DELIMITER $$

CREATE PROCEDURE sp_ReportAndAssignMaintenance(
    IN p_VehicleID INT,
    IN p_IssueReported TEXT
)
BEGIN
    DECLARE v_LogID INT;
    DECLARE v_TechnicianID INT;
    
    -- Error handler: If any statement fails, rollback the entire transaction.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL; -- Re-throw the error so the application knows it failed
    END;

    -- Start the transaction
    START TRANSACTION;

    -- 1. Update the vehicle's status to 'under-maintenance'
    UPDATE Vehicles
    SET Status = 'under-maintenance'
    WHERE VehicleID = p_VehicleID AND Status = 'available';

    -- 2. Create a new maintenance log entry
    INSERT INTO MaintenanceLogs (VehicleID, IssueReported, ReportedDate, Status)
    VALUES (p_VehicleID, p_IssueReported, CURDATE(), 'Pending');

    -- Get the ID of the log we just created
    SET v_LogID = LAST_INSERT_ID();

    -- 3. Find the least busy, available technician
    SELECT TechnicianID INTO v_TechnicianID
    FROM Technicians
    WHERE IsAvailable = TRUE
    ORDER BY ActiveAssignments ASC
    LIMIT 1;

    -- 4. If a technician was found, assign them and update their workload
    IF v_TechnicianID IS NOT NULL THEN
        -- Assign the log to the technician
        INSERT INTO TechnicianAssignments (LogID, TechnicianID)
        VALUES (v_LogID, v_TechnicianID);

        -- Increment the technician's active assignment count
        UPDATE Technicians
        SET ActiveAssignments = ActiveAssignments + 1
        WHERE TechnicianID = v_TechnicianID;

        -- Update the log status to reflect it's been assigned
        UPDATE MaintenanceLogs
        SET Status = 'In-Progress' -- Or 'Assigned', if you add it to the ENUM
        WHERE LogID = v_LogID;
    END IF;

    -- If everything was successful, commit the changes
    COMMIT;
END$$

DELIMITER ;

--VIEW
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

--STORED PROCEDURES

DELIMITER //

CREATE PROCEDURE sp_CreateBooking(
    IN p_UserID INT,
    IN p_VehicleID INT,
    IN p_StartStationID INT,
    IN p_DurationHours DECIMAL(5,2)
)
BEGIN
    DECLARE v_rate, v_cost, v_balance DECIMAL(10,2);
    DECLARE v_start_time, v_end_time DATETIME;

    START TRANSACTION;

    -- Check if vehicle is available and get rate
    SELECT RatePerHour INTO v_rate
    FROM Vehicles
    WHERE VehicleID = p_VehicleID AND Status = 'available'
    FOR UPDATE;

    IF v_rate IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle not available';
    END IF;

    -- Calculate cost
    SET v_cost = v_rate * p_DurationHours;

    -- Check user wallet
    SELECT WalletBalance INTO v_balance
    FROM Users
    WHERE UserID = p_UserID
    FOR UPDATE;

    IF v_balance < v_cost THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;

    -- Calculate start and end times
    SET v_start_time = NOW();
    SET v_end_time = DATE_ADD(v_start_time, INTERVAL p_DurationHours HOUR);

    -- Insert into Trips with both times
    INSERT INTO Trips(UserID, VehicleID, StartStationID, StartTime, EndTime, Cost, Status)
    VALUES(p_UserID, p_VehicleID, p_StartStationID, v_start_time, v_end_time, v_cost, 'Ongoing');

    -- Update vehicle status
    UPDATE Vehicles
    SET Status = 'in-use'
    WHERE VehicleID = p_VehicleID;

    -- Deduct fare from user's wallet
    UPDATE Users
    SET WalletBalance = WalletBalance - v_cost
    WHERE UserID = p_UserID;

    -- Insert payment record
    INSERT INTO Payments(TripID, UserID, Amount, Status)
    VALUES(LAST_INSERT_ID(), p_UserID, v_cost, 'Success');

    COMMIT;
END //

DELIMITER ;

-- END RIDE
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

DELIMITER $$

CREATE PROCEDURE sp_CancelTrip(
    IN p_TripID INT
)
BEGIN
    DECLARE v_VehicleID INT;
    DECLARE v_UserID INT;
    DECLARE v_Cost DECIMAL(10, 2);
    DECLARE v_TripStatus VARCHAR(20);

    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Get trip details and lock the row
    SELECT VehicleID, UserID, Cost, Status
    INTO v_VehicleID, v_UserID, v_Cost, v_TripStatus
    FROM Trips
    WHERE TripID = p_TripID
    FOR UPDATE;

    -- Only allow cancellation of 'Ongoing' trips
    IF v_TripStatus != 'Ongoing' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only ongoing trips can be cancelled';
    END IF;

    -- 1. Update Trip status to 'Cancelled'
    UPDATE Trips
    SET Status = 'Cancelled', EndTime = NOW() -- Mark an end time
    WHERE TripID = p_TripID;

    -- 2. Set Vehicle back to 'available'
    -- We assume it goes back to the station it started from
    UPDATE Vehicles v
    JOIN Trips t ON v.VehicleID = t.VehicleID
    SET v.Status = 'available', v.CurrentStationID = t.StartStationID
    WHERE t.TripID = p_TripID;

    -- 3. Refund the user's wallet
    UPDATE Users
    SET WalletBalance = WalletBalance + v_Cost
    WHERE UserID = v_UserID;

    -- 4. Update the payment record to 'Refunded'
    -- (Assuming you want to track this)
    UPDATE Payments
    SET Status = 'Refunded'
    WHERE TripID = p_TripID AND UserID = v_UserID;

    COMMIT;
END$$

DELIMITER ;


CREATE TABLE IF NOT EXISTS Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    TripID INT NOT NULL,
    UserID INT NOT NULL,
    VehicleID INT NOT NULL,
    Rating INT NOT NULL, -- e.g., 1 to 5
    Comment TEXT,
    ReviewDate DATE NOT NULL,
    
    FOREIGN KEY (TripID) REFERENCES Trips(TripID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    
    -- A user can only review a specific trip once
    UNIQUE KEY uq_user_trip (UserID, TripID),
    -- Add an index for quickly finding reviews for a vehicle
    INDEX idx_vehicle (VehicleID)
);


