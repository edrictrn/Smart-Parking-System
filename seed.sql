-- ==============================================================
-- IoT-SPMS demo seed data
-- Import after schema.sql. This data is for MVP demonstration only.
-- v9: 4 parking areas, 28 slots each, richer session history,
-- learner debts, paid_at revenue dates, visitor lookup, formatted reports.
-- ==============================================================

INSERT INTO Users (student_id, full_name, email, password, role, rfid, license_plate, accumulated_debt) VALUES
('ADMIN01', 'System Administrator', 'admin.parking@hcmut.edu.vn', '123456', 'Admin', '00:00:00:00:00', 'ADMIN-CAR', 0),
('OP001', 'Parking Operator', 'operator.parking@hcmut.edu.vn', '123456', 'ParkingOperator', 'OP:00:00:00:01', 'OP-BIKE', 0),
('FAC001', 'Nguyen Thanh Cong', 'cong.nguyen@hcmut.edu.vn', '123456', 'Faculty', 'FF:EE:DD:CC:01', '59-L1 999.99', 0),
('STAFF001', 'Le Thi Mai', 'mai.le@hcmut.edu.vn', '123456', 'Staff', 'AA:BB:CC:DD:88', '51-F1 444.44', 0),
('2352299', 'Tran Quoc Hao', 'hao.tran@hcmut.edu.vn', '123456', 'Learner', 'E4:2A:98:1F:22', '66-P1 123.45', 90000),
('2352232', 'Nguyen Bao Dat', 'dat.nguyen@hcmut.edu.vn', '676767', 'Learner', 'C3:D4:E5:F6:33', '59-G1 888.88', 45000),
('2352326', 'Ngo Thanh Hieu', 'hieu.ngo@hcmut.edu.vn', '123456', 'Learner', 'A1:B2:C3:D4:44', '59-S2 567.89', 0),
('2352636', 'Huynh Xuan Khuong', 'khuong.huynh@hcmut.edu.vn', '123456', 'Learner', 'B1:C2:D3:E4:55', '71-C2 111.11', 135000),
('2352227', 'Ho Tran Minh Dat', 'dat.ho@hcmut.edu.vn', '363636', 'Learner', 'D5:E6:F7:G8:66', '60-B3 222.22', 30000),
('2353320', 'Nguyen Viet', 'viet.nguyen@hcmut.edu.vn', '181818', 'Learner', 'A9:B0:C1:D2:77', '50-A4 333.33', 45000);

INSERT INTO Parking_slots (zone, sensor_mac, status) VALUES
('Khu A - Sân trước', 'MAC:A01', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A02', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A03', 'OCCUPIED'),
('Khu A - Sân trước', 'MAC:A04', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A05', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A06', 'UNKNOWN'),
('Khu A - Sân trước', 'MAC:A07', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A08', 'OCCUPIED'),
('Khu A - Sân trước', 'MAC:A09', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A10', 'OUT_OF_SERVICE'),
('Khu A - Sân trước', 'MAC:A11', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A12', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A13', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A14', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A15', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A16', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A17', 'UNKNOWN'),
('Khu A - Sân trước', 'MAC:A18', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A19', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A20', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A21', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A22', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A23', 'OUT_OF_SERVICE'),
('Khu A - Sân trước', 'MAC:A24', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A25', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A26', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A27', 'EMPTY'),
('Khu A - Sân trước', 'MAC:A28', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B01', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B02', 'OCCUPIED'),
('Khu B - Nhà xe CSE', 'MAC:B03', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B04', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B05', 'UNKNOWN'),
('Khu B - Nhà xe CSE', 'MAC:B06', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B07', 'OCCUPIED'),
('Khu B - Nhà xe CSE', 'MAC:B08', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B09', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B10', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B11', 'OUT_OF_SERVICE'),
('Khu B - Nhà xe CSE', 'MAC:B12', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B13', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B14', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B15', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B16', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B17', 'UNKNOWN'),
('Khu B - Nhà xe CSE', 'MAC:B18', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B19', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B20', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B21', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B22', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B23', 'OUT_OF_SERVICE'),
('Khu B - Nhà xe CSE', 'MAC:B24', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B25', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B26', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B27', 'EMPTY'),
('Khu B - Nhà xe CSE', 'MAC:B28', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C01', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C02', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C03', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C04', 'OCCUPIED'),
('Khu C - Cổng sau', 'MAC:C05', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C06', 'UNKNOWN'),
('Khu C - Cổng sau', 'MAC:C07', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C08', 'OCCUPIED'),
('Khu C - Cổng sau', 'MAC:C09', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C10', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C11', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C12', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C13', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C14', 'OUT_OF_SERVICE'),
('Khu C - Cổng sau', 'MAC:C15', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C16', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C17', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C18', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C19', 'UNKNOWN'),
('Khu C - Cổng sau', 'MAC:C20', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C21', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C22', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C23', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C24', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C25', 'OUT_OF_SERVICE'),
('Khu C - Cổng sau', 'MAC:C26', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C27', 'EMPTY'),
('Khu C - Cổng sau', 'MAC:C28', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D01', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D02', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D03', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D04', 'OCCUPIED'),
('Khu D - Nhà xe B4', 'MAC:D05', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D06', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D07', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D08', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D09', 'UNKNOWN'),
('Khu D - Nhà xe B4', 'MAC:D10', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D11', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D12', 'OCCUPIED'),
('Khu D - Nhà xe B4', 'MAC:D13', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D14', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D15', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D16', 'OUT_OF_SERVICE'),
('Khu D - Nhà xe B4', 'MAC:D17', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D18', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D19', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D20', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D21', 'UNKNOWN'),
('Khu D - Nhà xe B4', 'MAC:D22', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D23', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D24', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D25', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D26', 'EMPTY'),
('Khu D - Nhà xe B4', 'MAC:D27', 'OUT_OF_SERVICE'),
('Khu D - Nhà xe B4', 'MAC:D28', 'EMPTY');

INSERT INTO System_config (config_key, config_value) VALUES
('PRICE_LEARNER_MONTHLY', '45000'),
('PRICE_VISITOR_PER_SESSION', '5000'),
('PRICE_FACULTY_PER_SESSION', '0'),
('PRICE_STAFF_PER_SESSION', '0'),
('BILLING_MODE', 'LEARNER_MONTHLY_VISITOR_PER_SESSION');

-- Active card/visitor sessions: these make some slots OCCUPIED and show "Đang đậu xe" in history.
INSERT INTO Parking_sessions (user_id, slot_id, check_in_time, status, source, fee_calculated) VALUES
((SELECT user_id FROM Users WHERE student_id = 'FAC001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A03'), TIMESTAMP(CURDATE(), '07:10:00'), 'Parked', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A08'), TIMESTAMP(CURDATE(), '11:20:00'), 'Parked', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352326'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B02'), TIMESTAMP(CURDATE(), '08:05:00'), 'Parked', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = 'STAFF001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C04'), TIMESTAMP(CURDATE(), '09:20:00'), 'Parked', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352232'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C08'), TIMESTAMP(CURDATE(), '10:05:00'), 'Parked', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352636'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D04'), TIMESTAMP(CURDATE(), '13:05:00'), 'Parked', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2353320'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D12'), TIMESTAMP(CURDATE(), '15:15:00'), 'Parked', 'CARD', 0);

INSERT INTO Temporary_tickets (ticket_code, slot_id, issued_at, status, fee_paid) VALUES
('TMP-DEMO-ACTIVE-001', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B07'), TIMESTAMP(CURDATE(), '10:30:00'), 'Active', 0);

INSERT INTO Parking_sessions (slot_id, visitor_ticket_code, check_in_time, status, source, fee_calculated) VALUES
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B07'), 'TMP-DEMO-ACTIVE-001', TIMESTAMP(CURDATE(), '10:30:00'), 'Parked', 'TEMPORARY_TICKET', 0);

-- Completed card sessions: each learner has visible history; 2352299 has at least 6 records plus 1 active.
INSERT INTO Parking_sessions (user_id, slot_id, check_in_time, check_out_time, status, source, fee_calculated) VALUES
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A01'), TIMESTAMP(CURDATE(), '06:15:00'), TIMESTAMP(CURDATE(), '06:55:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B03'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:10:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '11:45:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C02'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '12:25:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '15:10:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D03'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '13:25:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '17:10:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A12'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:35:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:40:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352299'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B21'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '18:25:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '20:10:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352232'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A02'), TIMESTAMP(CURDATE(), '08:40:00'), TIMESTAMP(CURDATE(), '12:05:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352232'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D22'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '14:40:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '18:05:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352636'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A04'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '10:05:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '15:30:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2353320'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B08'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '14:15:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '16:40:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352227'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C03'), TIMESTAMP(CURDATE(), '14:05:00'), TIMESTAMP(CURDATE(), '18:10:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352326'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D10'), TIMESTAMP(CURDATE(), '17:00:00'), TIMESTAMP(CURDATE(), '18:20:00'), 'Completed', 'CARD', 0);

INSERT INTO Temporary_tickets (ticket_code, slot_id, issued_at, closed_at, status, fee_paid) VALUES
('TMP-DEMO-CLOSED-001', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A05'), TIMESTAMP(CURDATE(), '12:15:00'), TIMESTAMP(CURDATE(), '13:20:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-002', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B06'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:10:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-003', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C05'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '16:15:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '18:25:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-004', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D05'), TIMESTAMP(CURDATE(), '19:10:00'), TIMESTAMP(CURDATE(), '20:05:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-005', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D06'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:45:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:05:00'), 'Closed', 5000);

INSERT INTO Parking_sessions (slot_id, visitor_ticket_code, check_in_time, check_out_time, status, source, fee_calculated) VALUES
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A05'), 'TMP-DEMO-CLOSED-001', TIMESTAMP(CURDATE(), '12:15:00'), TIMESTAMP(CURDATE(), '13:20:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B06'), 'TMP-DEMO-CLOSED-002', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:10:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C05'), 'TMP-DEMO-CLOSED-003', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '16:15:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '18:25:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D05'), 'TMP-DEMO-CLOSED-004', TIMESTAMP(CURDATE(), '19:10:00'), TIMESTAMP(CURDATE(), '20:05:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D06'), 'TMP-DEMO-CLOSED-005', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:45:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:05:00'), 'Completed', 'TEMPORARY_TICKET', 5000);

-- PaymentReady rows below equal the current accumulated_debt values. Paid learners have lower or zero debt.
INSERT INTO Transactions (user_id, amount, status, transaction_type, billing_cycle, description, created_at) VALUES
((SELECT user_id FROM Users WHERE student_id = '2352299'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(CURDATE(), '%Y-%m'), 'Monthly learner parking fee for current cycle', TIMESTAMP(CURDATE(), '07:00:00')),
((SELECT user_id FROM Users WHERE student_id = '2352299'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), 'Monthly learner parking fee for previous cycle', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 30 DAY), '07:00:00')),
((SELECT user_id FROM Users WHERE student_id = '2352232'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(CURDATE(), '%Y-%m'), 'Monthly learner parking fee for current cycle', TIMESTAMP(CURDATE(), '07:05:00')),
((SELECT user_id FROM Users WHERE student_id = '2352636'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(CURDATE(), '%Y-%m'), 'Monthly learner parking fee for current cycle', TIMESTAMP(CURDATE(), '07:10:00')),
((SELECT user_id FROM Users WHERE student_id = '2352636'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), 'Monthly learner parking fee for previous cycle', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 30 DAY), '07:10:00')),
((SELECT user_id FROM Users WHERE student_id = '2352636'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), 'Monthly learner parking fee for two cycles ago', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 60 DAY), '07:10:00')),
((SELECT user_id FROM Users WHERE student_id = '2352227'), 30000, 'PaymentReady', 'ManualAdjustment', DATE_FORMAT(CURDATE(), '%Y-%m'), 'Manual debt adjustment for demo', TIMESTAMP(CURDATE(), '07:20:00')),
((SELECT user_id FROM Users WHERE student_id = '2353320'), 45000, 'PaymentReady', 'LearnerBilling', DATE_FORMAT(CURDATE(), '%Y-%m'), 'Monthly learner parking fee for current cycle', TIMESTAMP(CURDATE(), '07:30:00'));

-- paid_at is the date used by the revenue chart. Payments made on 30/4 appear under 04-30.
INSERT INTO Transactions (user_id, ticket_code, amount, bkpay_ref_id, status, transaction_type, billing_cycle, description, created_at, paid_at) VALUES
(NULL, 'TMP-DEMO-CLOSED-001', 5000, 'VIS-DEMO-001', 'Paid', 'VisitorImmediate', NULL, 'Visitor immediate payment today', TIMESTAMP(CURDATE(), '13:20:00'), TIMESTAMP(CURDATE(), '13:20:00')),
(NULL, 'TMP-DEMO-CLOSED-004', 5000, 'VIS-DEMO-004', 'Paid', 'VisitorImmediate', NULL, 'Visitor immediate payment evening today', TIMESTAMP(CURDATE(), '20:05:00'), TIMESTAMP(CURDATE(), '20:05:00')),
(NULL, 'TMP-DEMO-CLOSED-002', 5000, 'VIS-DEMO-002', 'Paid', 'VisitorImmediate', NULL, 'Visitor immediate payment yesterday', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00')),
(NULL, 'TMP-DEMO-CLOSED-003', 5000, 'VIS-DEMO-003', 'Paid', 'VisitorImmediate', NULL, 'Visitor immediate payment two days ago', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '18:25:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '18:25:00')),
(NULL, 'TMP-DEMO-CLOSED-005', 5000, 'VIS-DEMO-005', 'Paid', 'VisitorImmediate', NULL, 'Visitor payment four days ago', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:05:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:05:00')),
((SELECT user_id FROM Users WHERE student_id = '2352326'), NULL, 45000, 'BKP-DEMO-001', 'Paid', 'LearnerBilling', DATE_FORMAT(CURDATE(), '%Y-%m'), 'Learner monthly fee paid today; debt already 0', TIMESTAMP(CURDATE(), '15:45:00'), TIMESTAMP(CURDATE(), '15:45:00')),
((SELECT user_id FROM Users WHERE student_id = '2352232'), NULL, 45000, 'BKP-DEMO-002', 'Paid', 'LearnerBilling', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), 'Past learner payment for dashboard chart', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '15:10:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '15:10:00')),
((SELECT user_id FROM Users WHERE student_id = '2353320'), NULL, 45000, 'BKP-DEMO-003', 'Paid', 'LearnerBilling', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), 'Past learner payment for dashboard chart', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:40:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:40:00'));

INSERT INTO Operation_logs (action, detail, created_at) VALUES
('SEED_DATABASE', 'v8 seed: 4 parking areas x 28 slots, debts, paid_at revenue dates, histories and active visitor ticket inserted.', NOW()),
('DATACORE_SYNC_MOCK', 'Initial seeded sync timestamp for dashboard.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('DEMO_NOTE', 'Learners use monthly billing; visitors use per-session payment.', NOW());

-- ==============================================================
-- v8 supplemental demo data: balanced histories for every learner,
-- Faculty/Staff and more visitor transactions for richer dashboards.
-- ============================================================== 

INSERT INTO Parking_sessions (user_id, slot_id, check_in_time, check_out_time, status, source, fee_calculated) VALUES
-- Nguyen Bao Dat: more completed learner histories
((SELECT user_id FROM Users WHERE student_id = '2352232'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A14'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:55:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:20:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352232'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B14'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '12:30:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '16:05:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352232'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C16'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '18:15:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '20:00:00'), 'Completed', 'CARD', 0),
-- Ngo Thanh Hieu: more histories plus current active already exists
((SELECT user_id FROM Users WHERE student_id = '2352326'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A15'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '06:40:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352326'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B15'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '11:20:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '13:55:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352326'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C15'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '15:45:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '18:30:00'), 'Completed', 'CARD', 0),
-- Huynh Xuan Khuong
((SELECT user_id FROM Users WHERE student_id = '2352636'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A18'), TIMESTAMP(CURDATE(), '06:50:00'), TIMESTAMP(CURDATE(), '08:10:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352636'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B18'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '13:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '16:15:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352636'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C18'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '19:05:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '21:00:00'), 'Completed', 'CARD', 0),
-- Ho Tran Minh Dat
((SELECT user_id FROM Users WHERE student_id = '2352227'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A19'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:35:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '11:25:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352227'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B19'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '12:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '14:40:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352227'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D19'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '16:10:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '19:25:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2352227'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A20'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '07:25:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:50:00'), 'Completed', 'CARD', 0),
-- Nguyen Viet
((SELECT user_id FROM Users WHERE student_id = '2353320'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A21'), TIMESTAMP(CURDATE(), '09:05:00'), TIMESTAMP(CURDATE(), '11:15:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2353320'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C21'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '13:40:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '15:35:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = '2353320'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D23'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '17:25:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '18:45:00'), 'Completed', 'CARD', 0),
-- Faculty and staff histories for non-learner demo accounts
((SELECT user_id FROM Users WHERE student_id = 'FAC001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A24'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:30:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '17:00:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = 'FAC001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B24'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '08:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '16:30:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = 'FAC001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C24'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:10:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '15:45:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = 'STAFF001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A25'), TIMESTAMP(CURDATE(), '07:45:00'), TIMESTAMP(CURDATE(), '16:55:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = 'STAFF001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B25'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:15:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '17:20:00'), 'Completed', 'CARD', 0),
((SELECT user_id FROM Users WHERE student_id = 'STAFF001'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C26'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:30:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '14:10:00'), 'Completed', 'CARD', 0);

INSERT INTO Temporary_tickets (ticket_code, slot_id, issued_at, closed_at, status, fee_paid) VALUES
('TMP-DEMO-CLOSED-006', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A26'), TIMESTAMP(CURDATE(), '08:25:00'), TIMESTAMP(CURDATE(), '09:05:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-007', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B26'), TIMESTAMP(CURDATE(), '14:30:00'), TIMESTAMP(CURDATE(), '15:10:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-008', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C27'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:05:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '19:30:00'), 'Closed', 5000),
('TMP-DEMO-CLOSED-009', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D24'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:45:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '12:20:00'), 'Closed', 5000);

INSERT INTO Parking_sessions (slot_id, visitor_ticket_code, check_in_time, check_out_time, status, source, fee_calculated) VALUES
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A26'), 'TMP-DEMO-CLOSED-006', TIMESTAMP(CURDATE(), '08:25:00'), TIMESTAMP(CURDATE(), '09:05:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:B26'), 'TMP-DEMO-CLOSED-007', TIMESTAMP(CURDATE(), '14:30:00'), TIMESTAMP(CURDATE(), '15:10:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:C27'), 'TMP-DEMO-CLOSED-008', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:05:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '19:30:00'), 'Completed', 'TEMPORARY_TICKET', 5000),
((SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:D24'), 'TMP-DEMO-CLOSED-009', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:45:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '12:20:00'), 'Completed', 'TEMPORARY_TICKET', 5000);

INSERT INTO Transactions (user_id, ticket_code, amount, bkpay_ref_id, status, transaction_type, billing_cycle, description, created_at, paid_at) VALUES
(NULL, 'TMP-DEMO-CLOSED-006', 5000, 'VIS-DEMO-006', 'Paid', 'VisitorImmediate', NULL, 'Additional visitor payment today morning', TIMESTAMP(CURDATE(), '09:05:00'), TIMESTAMP(CURDATE(), '09:05:00')),
(NULL, 'TMP-DEMO-CLOSED-007', 5000, 'VIS-DEMO-007', 'Paid', 'VisitorImmediate', NULL, 'Additional visitor payment today afternoon', TIMESTAMP(CURDATE(), '15:10:00'), TIMESTAMP(CURDATE(), '15:10:00')),
(NULL, 'TMP-DEMO-CLOSED-008', 5000, 'VIS-DEMO-008', 'Paid', 'VisitorImmediate', NULL, 'Additional visitor payment yesterday evening', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '19:30:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '19:30:00')),
(NULL, 'TMP-DEMO-CLOSED-009', 5000, 'VIS-DEMO-009', 'Paid', 'VisitorImmediate', NULL, 'Additional visitor payment three days ago', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '12:20:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '12:20:00'));

INSERT INTO Operation_logs (action, detail, created_at) VALUES
('SEED_SUPPLEMENT_V8', 'Balanced demo history added for all learners, faculty/staff and visitors.', NOW());


-- ==============================================================
-- v9 supplemental demo data: forgot-card temporary ticket lookup.
-- This allows operators to demonstrate searching a completed temporary
-- ticket that belongs to a known campus user who forgot their RFID card.
-- ==============================================================

INSERT INTO Temporary_tickets (ticket_code, slot_id, issued_at, closed_at, status, fee_paid) VALUES
('TMP-FORGOT-CARD-001', (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A27'), TIMESTAMP(CURDATE(), '16:25:00'), TIMESTAMP(CURDATE(), '17:05:00'), 'Closed', 5000);

INSERT INTO Parking_sessions (user_id, slot_id, visitor_ticket_code, check_in_time, check_out_time, status, source, fee_calculated) VALUES
((SELECT user_id FROM Users WHERE student_id = '2352326'), (SELECT slot_id FROM Parking_slots WHERE sensor_mac = 'MAC:A27'), 'TMP-FORGOT-CARD-001', TIMESTAMP(CURDATE(), '16:25:00'), TIMESTAMP(CURDATE(), '17:05:00'), 'Completed', 'TEMPORARY_TICKET', 5000);

INSERT INTO Transactions (user_id, ticket_code, amount, bkpay_ref_id, status, transaction_type, billing_cycle, description, created_at, paid_at) VALUES
((SELECT user_id FROM Users WHERE student_id = '2352326'), 'TMP-FORGOT-CARD-001', 5000, 'VIS-FORGOT-001', 'Paid', 'VisitorImmediate', NULL, 'Forgot-card temporary ticket payment for Ngo Thanh Hieu', TIMESTAMP(CURDATE(), '17:05:00'), TIMESTAMP(CURDATE(), '17:05:00'));

INSERT INTO Operation_logs (action, detail, created_at) VALUES
('SEED_SUPPLEMENT_V9', 'Added forgot-card temporary ticket lookup demo and formatted report support.', NOW());
