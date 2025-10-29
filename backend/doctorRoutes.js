const express = require('express');
const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');
const { checkAuth, checkRole } = require('./authMiddleware');

const router = express.Router();

router.use(checkAuth, checkRole(['Doctor']));


router.get('/schedule', async (req, res) => {
    const doctorId = req.user.doctorId; 
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            'SELECT * FROM v_DoctorSchedule WHERE doctor_id = ? ORDER BY appointment_time ASC',
            [doctorId]
        );
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching doctor schedule:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.get('/patients/:id/records', async (req, res) => {
    const { id: patientId } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            'SELECT * FROM MedicalRecords WHERE patient_id = ? ORDER BY visit_date DESC',
            [patientId]
        );
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching patient records:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.post('/records', async (req, res) => {
    const doctorId = req.user.doctorId;
    const { patientId, visitDate, diagnosis, notes } = req.body;

    if (!patientId || !visitDate) {
        return res.status(400).json({ error: 'patientId and visitDate are required.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_CreateMedicalRecord(?, ?, ?, ?, ?)';
        const params = [doctorId, patientId, visitDate, diagnosis, notes];
        
        const [results] = await connection.execute(sql, params);
        res.status(201).json(results[0][0]); 

    } catch (error) {
        console.error('Error creating medical record:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.put('/appointments/:id/complete', async (req, res) => {
    const doctorId = req.user.doctorId;
    const { id: appointmentId } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_CompleteAppointment(?, ?)';
        
        const [results] = await connection.execute(sql, [appointmentId, doctorId]);
        res.status(200).json(results[0][0]);

    } catch (error) {
        console.error('Error completing appointment:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;