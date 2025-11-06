-- Set database environment
CREATE DATABASE IF NOT EXISTS ev_rental_db;
USE ev_rental_db;

-- Table for Membership Plans
CREATE TABLE MembershipPlans (
  PlanID INT AUTO_INCREMENT PRIMARY KEY,
  PlanName VARCHAR(50) NOT NULL,
  Cost DECIMAL(10, 2) NOT NULL,
  DurationMonths INT NOT NULL,
  Benefits TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Users
CREATE TABLE Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) NOT NULL UNIQUE,
  WalletBalance DECIMAL(10, 2) DEFAULT 0.00,
  JoinDate DATE NOT NULL,
  PlanID INT,
  FOREIGN KEY (PlanID) REFERENCES MembershipPlans(PlanID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Stations
CREATE TABLE Stations (
  StationID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Location VARCHAR(255) NOT NULL,
  Capacity INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Vehicles
CREATE TABLE Vehicles (
  VehicleID INT AUTO_INCREMENT PRIMARY KEY,
  Type VARCHAR(50) NOT NULL,
  Model VARCHAR(50) NOT NULL,
  Manufacturer VARCHAR(50) NOT NULL,
  RatePerHour DECIMAL(10, 2) NOT NULL, -- MODIFIED: Added for dynamic pricing
  Status ENUM('available', 'in-use', 'under-maintenance') NOT NULL DEFAULT 'available',
  CurrentStationID INT,
  FOREIGN KEY (CurrentStationID) REFERENCES Stations(StationID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Trips
CREATE TABLE Trips (
  TripID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  VehicleID INT NOT NULL,
  StartStationID INT NOT NULL,
  EndStationID INT,
  StartTime DATETIME NOT NULL,
  EndTime DATETIME,
  Cost DECIMAL(10, 2) NOT NULL,
  Status ENUM('Upcoming', 'Ongoing', 'Completed') NOT NULL DEFAULT 'Upcoming',
  FOREIGN KEY (UserID) REFERENCES Users(UserID),
  FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
  FOREIGN KEY (StartStationID) REFERENCES Stations(StationID),
  FOREIGN KEY (EndStationID) REFERENCES Stations(StationID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Payments
CREATE TABLE Payments (
  PaymentID INT AUTO_INCREMENT PRIMARY KEY,
  TripID INT,
  UserID INT NOT NULL,
  Amount DECIMAL(10, 2) NOT NULL,
  Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Status VARCHAR(20) NOT NULL,
  FOREIGN KEY (TripID) REFERENCES Trips(TripID),
  FOREIGN KEY (UserID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Technicians
CREATE TABLE Technicians (
  TechnicianID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Specialization VARCHAR(100) NOT NULL,
  IsAvailable BOOLEAN NOT NULL DEFAULT TRUE, -- NEW: To check availability
  ActiveAssignments INT NOT NULL DEFAULT 0 -- NEW: To track workload
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Maintenance Logs
CREATE TABLE MaintenanceLogs (
  LogID INT AUTO_INCREMENT PRIMARY KEY,
  VehicleID INT NOT NULL,
  IssueReported TEXT NOT NULL,
  ReportedDate DATE NOT NULL,
  Status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Technician Assignments
CREATE TABLE TechnicianAssignments (
  AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
  LogID INT NOT NULL,
  TechnicianID INT NOT NULL,
  UNIQUE(LogID, TechnicianID), -- A log should only be assigned once to the same tech
  FOREIGN KEY (LogID) REFERENCES MaintenanceLogs(LogID),
  FOREIGN KEY (TechnicianID) REFERENCES Technicians(TechnicianID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE Users
ADD COLUMN Password VARCHAR(100) NOT NULL AFTER Email;

-- Add Role column for user/admin distinction
ALTER TABLE Users
ADD COLUMN Role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER Password;

ALTER TABLE Trips
MODIFY COLUMN Status ENUM('Upcoming','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Upcoming';