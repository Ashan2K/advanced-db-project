-- Create and Use the Database
DROP DATABASE IF EXISTS clinic_db;
CREATE DATABASE clinic_db;
USE clinic_db;

-- Create Specialties Table
CREATE TABLE Specialties (
    specialty_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Create Doctors Table
CREATE TABLE Doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialty_id INT,
    FOREIGN KEY (specialty_id) REFERENCES Specialties(specialty_id)
);

-- reate Patients Table
CREATE TABLE Patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    dob DATE
);

-- Create Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Never store plain text passwords
    role ENUM('Patient', 'Doctor', 'Admin') NOT NULL,
    
    -- Links to other tables
    linked_patient_id INT NULL UNIQUE,
    linked_doctor_id INT NULL UNIQUE,
    
    FOREIGN KEY (linked_patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (linked_doctor_id) REFERENCES Doctors(doctor_id)
);

-- reate Appointments Table
CREATE TABLE Appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_time DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id)
);

-- Create MedicalRecords Table
CREATE TABLE MedicalRecords (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    visit_date DATETIME NOT NULL,
    diagnosis VARCHAR(255),
    notes TEXT,
    
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id)
);

-- Populate Specialties
INSERT INTO Specialties (name) VALUES
('Cardiology'),
('Dermatology'),
('Pediatrics'),
('Neurology');

-- Populate Doctors
INSERT INTO Doctors (first_name, last_name, specialty_id) VALUES
('Nilantha', 'jayasuriya', 1),
('Amal', 'Perera', 2),
('Wasantha', 'liyanarachchi', 3);

-- Populate Patients
INSERT INTO Patients (first_name, last_name, email, phone, dob) VALUES
('Kamal', 'Perera', 'kamalperera@email.com', '555-0101', '1985-06-15'),
('Sunil', 'Silva', 'silva@email.com', '555-0102', '1992-11-30'),
('anura', 'franando', 'frenando@email.com', '555-0103', '1988-03-22');

-- Populate Users 
INSERT INTO Users (username, password_hash, role, linked_patient_id) VALUES
('kamal99', SHA2('pass123', 256), 'Patient', 1),
('sunil33', SHA2('pass123', 256), 'Patient', 2);

INSERT INTO Users (username, password_hash, role, linked_doctor_id) VALUES
('nilanthadr', SHA2('pass123', 256), 'Doctor', 1);

INSERT INTO Users (username, password_hash, role) VALUES
('admin', SHA2('adminpass', 256), 'Admin');


-- patient registration ---

DELIMITER $$

CREATE PROCEDURE sp_RegisterPatient(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    

    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_dob DATE
)

BEGIN
    
    DECLARE new_patient_id INT;

    START TRANSACTION;

    INSERT INTO Patients(first_name, last_name, email, phone, dob)
    VALUES(p_first_name, p_last_name, p_email, p_phone, p_dob);
    
    SET new_patient_id = LAST_INSERT_ID();
    
    INSERT INTO Users(username, password_hash, role, linked_patient_id)
    VALUES(p_username, p_password_hash, 'Patient', new_patient_id);
    
    COMMIT;
    
    SELECT new_patient_id AS patientId, p_username AS username;

END$$
DELIMITER ;

-- login --
DELIMITER $$

CREATE PROCEDURE sp_LoginUser(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        user_id, 
        username, 
        password_hash, 
        role,
        linked_patient_id,
        linked_doctor_id
    FROM Users 
    WHERE username = p_username;
END$$
DELIMITER ;

call sp_LoginUser('nilanthadr');

GRANT EXECUTE ON PROCEDURE clinic_db.sp_RegisterPatient TO 'api_user'@'localhost';
GRANT EXECUTE ON PROCEDURE clinic_db.sp_LoginUser TO 'api_user'@'localhost';
FLUSH PRIVILEGES;


DELIMITER $$
CREATE PROCEDURE sp_BookAppointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_appointment_time DATETIME
)

BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    START TRANSACTION;

    SELECT COUNT(*)
    INTO conflict_count
    FROM Appointments
    WHERE doctor_id = p_doctor_id 
      AND appointment_time = p_appointment_time
    FOR UPDATE; 

    IF conflict_count > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This time slot is already booked for this doctor.';
    ELSE
        INSERT INTO Appointments(patient_id, doctor_id, appointment_time, status)
        VALUES(p_patient_id, p_doctor_id, p_appointment_time, 'Scheduled');
        
        COMMIT;
        SELECT 'Appointment booked successfully' AS message, LAST_INSERT_ID() AS appointment_id;
    END IF;
END$$
DELIMITER ;

CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'admin@123';

GRANT EXECUTE ON PROCEDURE clinic_db.sp_BookAppointment TO 'api_user'@'localhost';

-- Grant other permissions the API will need
GRANT SELECT ON clinic_db.Patients TO 'api_user'@'localhost';
GRANT SELECT ON clinic_db.Doctors TO 'api_user'@'localhost';
GRANT SELECT ON clinic_db.Specialties TO 'api_user'@'localhost';
GRANT SELECT ON clinic_db.Appointments TO 'api_user'@'localhost';

-- Add any other permissions your API might need 
GRANT SELECT ON clinic_db.Users TO 'api_user'@'localhost';

-- Refresh the database permissions
FLUSH PRIVILEGES;


CREATE VIEW v_UpcomingSchedule AS
SELECT 
    A.appointment_id,
    A.appointment_time,
    A.status,
    CONCAT(P.first_name, ' ', P.last_name) AS patient_name,
    CONCAT('Dr. ', D.first_name, ' ', D.last_name) AS doctor_name,
    S.name AS specialty
FROM 
    Appointments AS A
JOIN 
    Patients AS P ON A.patient_id = P.patient_id
JOIN 
    Doctors AS D ON A.doctor_id = D.doctor_id
JOIN 
    Specialties AS S ON D.specialty_id = S.specialty_id
WHERE 
    A.appointment_time > NOW()
ORDER BY 
    A.appointment_time;

SELECT * FROM v_UpcomingSchedule;

GRANT SELECT ON clinic_db.v_UpcomingSchedule TO 'api_user'@'localhost';
FLUSH PRIVILEGES;


DELIMITER $$

CREATE FUNCTION fn_CalculateAge(
    p_dob DATE
)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END$$

DELIMITER ;

GRANT EXECUTE ON FUNCTION clinic_db.fn_CalculateAge TO 'api_user'@'localhost';
FLUSH PRIVILEGES;

CREATE VIEW v_PatientProfile AS
SELECT
    P.patient_id,
    U.username,
    P.first_name,
    P.last_name,
    P.email,
    P.phone,
    P.dob,
    fn_CalculateAge(P.dob) AS age -- Use the function you already built!
FROM
    Patients AS P
JOIN
    Users AS U ON P.patient_id = U.linked_patient_id;
    

CREATE VIEW v_PatientAppointments AS
SELECT 
    A.appointment_id,
    A.appointment_time,
    A.status,
    CONCAT('Dr. ', D.first_name, ' ', D.last_name) AS doctor_name,
    S.name AS specialty,
    P.patient_id -- IMPORTANT: We need this to filter by patient
FROM 
    Appointments AS A
JOIN 
    Doctors AS D ON A.doctor_id = D.doctor_id
JOIN 
    Specialties AS S ON D.specialty_id = S.specialty_id
JOIN
    Patients AS P ON A.patient_id = P.patient_id;


DELIMITER $$

CREATE PROCEDURE sp_CancelAppointment(
    IN p_appointment_id INT,
    IN p_patient_id INT -- Sent from the user's token
)
BEGIN
    DECLARE owner_id INT;
    
    -- Check who owns the appointment
    SELECT patient_id INTO owner_id 
    FROM Appointments 
    WHERE appointment_id = p_appointment_id;
    
    -- Security check
    IF owner_id = p_patient_id THEN
        -- User is the owner, proceed with update
        UPDATE Appointments
        SET status = 'Cancelled'
        WHERE appointment_id = p_appointment_id
          AND status = 'Scheduled'; -- Only cancel if it's still scheduled
        
        SELECT 'Appointment cancelled successfully.' AS message;
    ELSE
        -- User is not the owner, signal an error
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forbidden: You do not own this appointment.';
    END IF;
END$$
DELIMITER ;

GRANT SELECT ON clinic_db.v_PatientProfile TO 'api_user'@'localhost';
GRANT SELECT ON clinic_db.v_PatientAppointments TO 'api_user'@'localhost';
GRANT EXECUTE ON PROCEDURE clinic_db.sp_CancelAppointment TO 'api_user'@'localhost';
FLUSH PRIVILEGES;

DELIMITER $$
CREATE PROCEDURE sp_CreateMedicalRecord(
    IN p_doctor_id INT,
    IN p_patient_id INT,
    IN p_visit_date DATETIME,
    IN p_diagnosis VARCHAR(255),
    IN p_notes TEXT
)
BEGIN
    INSERT INTO MedicalRecords(doctor_id, patient_id, visit_date, diagnosis, notes)
    VALUES(p_doctor_id, p_patient_id, p_visit_date, p_diagnosis, p_notes);
    
    SELECT LAST_INSERT_ID() AS record_id, 'Medical record created successfully.' AS message;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_CompleteAppointment(
    IN p_appointment_id INT,
    IN p_doctor_id INT -- Security check
)
BEGIN
    UPDATE Appointments
    SET status = 'Completed'
    WHERE appointment_id = p_appointment_id
      AND doctor_id = p_doctor_id;
    
    SELECT 'Appointment marked as completed.' AS message;
END$$
DELIMITER ;

CREATE VIEW v_DoctorSchedule AS
SELECT 
    A.appointment_id,
    A.appointment_time,
    A.status,
    A.doctor_id,
    P.patient_id,
    CONCAT(P.first_name, ' ', P.last_name) AS patient_name,
    P.phone AS patient_phone,
    P.dob AS patient_dob
FROM 
    Appointments AS A
JOIN 
    Patients AS P ON A.patient_id = P.patient_id
WHERE
    A.status = 'Scheduled'; 
    
GRANT EXECUTE ON PROCEDURE clinic_db.sp_CreateMedicalRecord TO 'api_user'@'localhost';
GRANT EXECUTE ON PROCEDURE clinic_db.sp_CompleteAppointment TO 'api_user'@'localhost';
GRANT SELECT ON clinic_db.v_DoctorSchedule TO 'api_user'@'localhost';
GRANT SELECT ON clinic_db.MedicalRecords TO 'api_user'@'localhost'; 
FLUSH PRIVILEGES;

INSERT INTO Users(username, password_hash, role, linked_doctor_id) 
VALUES('drwasantha', SHA2('docpass123', 256), 'Doctor', 3);

select * from Doctors;

select * from Users;




ALTER TABLE Doctors
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;


DELIMITER $$

CREATE PROCEDURE sp_AdminCreateDoctor(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_specialty_id INT
)
BEGIN
    DECLARE new_doctor_id INT;
    START TRANSACTION;

    INSERT INTO Doctors(first_name, last_name, specialty_id, is_active)
    VALUES(p_first_name, p_last_name, p_specialty_id, TRUE);
    
    SET new_doctor_id = LAST_INSERT_ID();
    
    INSERT INTO Users(username, password_hash, role, linked_doctor_id)
    VALUES(p_username, p_password_hash, 'Doctor', new_doctor_id);
    
    COMMIT;
    SELECT new_doctor_id AS doctorId, p_username AS username;
END$$
DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_AdminDeactivateDoctor(
    IN p_doctor_id INT
)
BEGIN
   
    UPDATE Doctors
    SET is_active = FALSE
    WHERE doctor_id = p_doctor_id;
    
    
    UPDATE Users
    SET password_hash = 'DEACTIVATED' 
    WHERE linked_doctor_id = p_doctor_id;
    
    SELECT 'Doctor account deactivated.' AS message;
END$$
DELIMITER ;



DELIMITER $$
CREATE FUNCTION fn_CountAppointmentsToday()
RETURNS INT
DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE count INT;
    SELECT COUNT(*) INTO count 
    FROM Appointments 
    WHERE DATE(appointment_time) = CURDATE();
    RETURN count;
END$$
DELIMITER ;

select * from appointments;

select * from Patients;


DROP FUNCTION IF EXISTS fn_CountNewPatientsThisMonth;


DELIMITER $$
CREATE FUNCTION fn_CountNewPatientsThisMonth()
RETURNS INT
DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE patient_count INT; 
    
    SELECT COUNT(*) 
    INTO patient_count 
    FROM Patients 
    WHERE MONTH(created_at) = MONTH(CURDATE()) 
      AND YEAR(created_at) = YEAR(CURDATE());
      
    
    RETURN patient_count;

END$$
DELIMITER ;

ALTER TABLE Patients 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

GRANT EXECUTE ON PROCEDURE clinic_db.sp_AdminCreateDoctor TO 'api_user'@'localhost';
GRANT EXECUTE ON PROCEDURE clinic_db.sp_AdminDeactivateDoctor TO 'api_user'@'localhost';
GRANT EXECUTE ON FUNCTION clinic_db.fn_CountAppointmentsToday TO 'api_user'@'localhost';
GRANT EXECUTE ON FUNCTION clinic_db.fn_CountNewPatientsThisMonth TO 'api_user'@'localhost';
GRANT INSERT, UPDATE, DELETE ON clinic_db.Specialties TO 'api_user'@'localhost';
GRANT UPDATE ON clinic_db.Doctors TO 'api_user'@'localhost';
FLUSH PRIVILEGES;

select * from Users;
