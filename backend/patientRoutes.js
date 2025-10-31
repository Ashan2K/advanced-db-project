const express = require('express');
const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');
const { checkAuth, checkRole } = require('./authMiddleware'); 

const router = express.Router();


router.use(checkAuth, checkRole(['Patient']));


router.get('/profile', async (req, res) => {
    const patientId = req.user.patientId; 
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            'SELECT * FROM v_PatientProfile WHERE patient_id = ?', 
            [patientId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.put('/profile', async (req, res) => {
    
    const patientId = req.user.patientId; 
    
 
    const { first_name, last_name, email, phone, dob } = req.body;

 
    if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }
    const formattedDob = new Date(dob).toISOString().split('T')[0];
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_UpdatePatientProfile(?, ?, ?, ?, ?, ?)';
        const params = [patientId, first_name, last_name, email, phone, formattedDob];
        
        const [results] = await connection.execute(sql, params);
        
    
        res.status(200).json(results[0][0]); 

    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'This email is already in use.' });
        }
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});

router.get('/appointments', async (req, res) => {
    const patientId = req.user.patientId; 
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            'SELECT * FROM v_PatientAppointments WHERE patient_id = ? ORDER BY appointment_time DESC', 
            [patientId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.get('/doctors', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.query(
            `SELECT d.doctor_id, d.first_name, d.last_name, s.name as specialty 
             FROM Doctors d
             JOIN Specialties s ON d.specialty_id = s.specialty_id
             WHERE d.is_active = TRUE
             ORDER BY d.last_name`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.post('/book-appointment', async (req, res) => {
    
    const patientId = req.user.patientId; 
    const { doctorId, appointmentTime } = req.body;

    if (!doctorId || !appointmentTime) {
        return res.status(400).json({ error: 'Missing required fields: doctorId, appointmentTime' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        
        const sql = 'CALL sp_BookAppointment(?, ?, ?)';
        const params = [patientId, doctorId, appointmentTime];
        
        const [results] = await connection.execute(sql, params);
        res.status(201).json(results[0][0]); 
    } catch (error) {
        console.error('Error booking appointment:', error);
        
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(409).json({ error: error.message }); 
        }
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


router.put('/appointments/:id/cancel', async (req, res) => {
    const patientId = req.user.patientId; 
    const { id: appointmentId } = req.params; 
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_CancelAppointment(?, ?)';
        const params = [appointmentId, patientId];
        
        const [results] = await connection.execute(sql, params);
        res.status(200).json(results[0][0]); 
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});

router.get('/medicalrecords', async (req, res) => {
    const patientId = req.user.patientId; 
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.query(
            'SELECT * FROM v_PatientMedicalRecords WHERE patient_id = ? ORDER BY visit_date DESC', 
            [patientId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;