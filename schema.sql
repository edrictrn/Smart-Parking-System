-- ==============================================================
-- IoT-SPMS database schema
-- This file contains STRUCTURE ONLY. Demo data is moved to seed.sql
-- ============================================================== 

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Operation_logs;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Temporary_tickets;
DROP TABLE IF EXISTS Parking_sessions;
DROP TABLE IF EXISTS Parking_slots;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS System_config;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users synchronized from HCMUT_DATACORE / local admin seed
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Learner', 'Faculty', 'Staff', 'Visitor', 'ParkingOperator', 'Admin') DEFAULT 'Learner',
    rfid VARCHAR(50) UNIQUE,
    license_plate VARCHAR(50),
    accumulated_debt INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Physical parking slots and IoT sensor status
CREATE TABLE Parking_slots (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    zone VARCHAR(50) NOT NULL,
    status ENUM('EMPTY', 'OCCUPIED', 'UNKNOWN', 'OUT_OF_SERVICE') DEFAULT 'UNKNOWN',
    sensor_mac VARCHAR(50) UNIQUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Parking sessions for both HCMUT card users and temporary visitors
CREATE TABLE Parking_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    slot_id INT NULL,
    visitor_ticket_code VARCHAR(80) NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL,
    status ENUM('Parked', 'Completed', 'Cancelled') DEFAULT 'Parked',
    source ENUM('CARD', 'TEMPORARY_TICKET', 'MANUAL') DEFAULT 'CARD',
    fee_calculated INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (slot_id) REFERENCES Parking_slots(slot_id) ON DELETE SET NULL,
    INDEX idx_session_user_status (user_id, status),
    INDEX idx_session_ticket_status (visitor_ticket_code, status)
);

-- 4. Temporary tickets for visitors / forgot-card cases
CREATE TABLE Temporary_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_code VARCHAR(80) UNIQUE NOT NULL,
    slot_id INT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    status ENUM('Active', 'Closed', 'Lost', 'Cancelled') DEFAULT 'Active',
    fee_paid INT DEFAULT 0,
    FOREIGN KEY (slot_id) REFERENCES Parking_slots(slot_id) ON DELETE SET NULL
);

-- 5. Financial transactions and BKPay mock callbacks
CREATE TABLE Transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    session_id INT NULL,
    ticket_code VARCHAR(80) NULL,
    amount INT NOT NULL,
    bkpay_ref_id VARCHAR(100),
    status ENUM('PaymentReady', 'Processing', 'Paid', 'Failed', 'Cancelled', 'Pending') DEFAULT 'PaymentReady',
    transaction_type ENUM('LearnerBilling', 'VisitorImmediate', 'ManualAdjustment') DEFAULT 'LearnerBilling',
    billing_cycle VARCHAR(7) NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES Parking_sessions(session_id) ON DELETE SET NULL,
    INDEX idx_transaction_status (status),
    INDEX idx_transaction_created_at (created_at),
    INDEX idx_transaction_paid_at (paid_at),
    INDEX idx_transaction_billing_cycle (billing_cycle)
);

-- 6. Role-based pricing configuration
CREATE TABLE System_config (
    config_key VARCHAR(80) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Operation and audit logs
CREATE TABLE Operation_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    actor_id INT NULL,
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_log_action (action),
    INDEX idx_log_created_at (created_at)
);
