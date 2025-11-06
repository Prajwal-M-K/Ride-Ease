USE ev_rental_db;

-- ========================================================
--  LOGS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS Logs (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    TableName VARCHAR(50) NOT NULL,
    OperationType ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    RecordID INT NULL,
    ChangedBy INT NULL, -- Optional: can map to Users.UserID (if known)
    ChangeDescription TEXT,
    ChangeTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
--  TRIGGERS FOR AUTOMATIC LOGGING
-- ========================================================

-- ---- TRIPS LOGGING ----
DELIMITER $$

CREATE TRIGGER trg_after_trip_insert
AFTER INSERT ON Trips
FOR EACH ROW
BEGIN
    INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
    VALUES (
        'Trips',
        'INSERT',
        NEW.TripID,
        CONCAT('New trip created: UserID=', NEW.UserID,
               ', VehicleID=', NEW.VehicleID,
               ', Status=', NEW.Status)
    );
END $$

CREATE TRIGGER trg_after_trip_update
AFTER UPDATE ON Trips
FOR EACH ROW
BEGIN
    INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
    VALUES (
        'Trips',
        'UPDATE',
        NEW.TripID,
        CONCAT('Trip updated from Status=', OLD.Status, ' to ', NEW.Status)
    );
END $$

CREATE TRIGGER trg_after_trip_delete
AFTER DELETE ON Trips
FOR EACH ROW
BEGIN
    INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
    VALUES (
        'Trips',
        'DELETE',
        OLD.TripID,
        'Trip record deleted'
    );
END $$

-- ---- PAYMENTS LOGGING ----
CREATE TRIGGER trg_after_payment_insert
AFTER INSERT ON Payments
FOR EACH ROW
BEGIN
    INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
    VALUES (
        'Payments',
        'INSERT',
        NEW.PaymentID,
        CONCAT('Payment created: Amount=', NEW.Amount,
               ', Status=', NEW.Status, ', UserID=', NEW.UserID)
    );
END $$

CREATE TRIGGER trg_after_payment_update
AFTER UPDATE ON Payments
FOR EACH ROW
BEGIN
    INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
    VALUES (
        'Payments',
        'UPDATE',
        NEW.PaymentID,
        CONCAT('Payment status changed from ', OLD.Status, ' to ', NEW.Status)
    );
END $$

-- ---- VEHICLE LOGGING ----
CREATE TRIGGER trg_after_vehicle_update
AFTER UPDATE ON Vehicles
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
        VALUES (
            'Vehicles',
            'UPDATE',
            NEW.VehicleID,
            CONCAT('Vehicle status changed from ', OLD.Status, ' to ', NEW.Status)
        );
    END IF;
END $$

-- ---- MAINTENANCE LOGGING ----
CREATE TRIGGER trg_after_maintenance_insert
AFTER INSERT ON MaintenanceLogs
FOR EACH ROW
BEGIN
    INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
    VALUES (
        'MaintenanceLogs',
        'INSERT',
        NEW.LogID,
        CONCAT('Maintenance issue reported for VehicleID=', NEW.VehicleID,
               ', Issue: ', NEW.IssueReported)
    );
END $$

CREATE TRIGGER trg_after_maintenance_update
AFTER UPDATE ON MaintenanceLogs
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
        VALUES (
            'MaintenanceLogs',
            'UPDATE',
            NEW.LogID,
            CONCAT('Maintenance log status changed from ', OLD.Status, ' to ', NEW.Status)
        );
    END IF;
END $$

-- ---- USER LOGGING ----
CREATE TRIGGER trg_after_user_update
AFTER UPDATE ON Users
FOR EACH ROW
BEGIN
    IF OLD.WalletBalance <> NEW.WalletBalance THEN
        INSERT INTO Logs (TableName, OperationType, RecordID, ChangeDescription)
        VALUES (
            'Users',
            'UPDATE',
            NEW.UserID,
            CONCAT('Wallet balance changed from ', OLD.WalletBalance,
                   ' to ', NEW.WalletBalance)
        );
    END IF;
END $$

DELIMITER ;

-- ========================================================
-- END OF LOGGING SYSTEM
-- ========================================================
