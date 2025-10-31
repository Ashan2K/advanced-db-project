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
    const formatedVisitDate = new Date(visitDate).toISOString().split('T')[0];
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_CreateMedicalRecord(?, ?, ?, ?, ?)';
        const params = [doctorId, patientId, formatedVisitDate, diagnosis, notes];
        
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

router.get('/availability', async (req, res) => {
    const doctorId = req.user.doctorId;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute(
            'CALL sp_GetDoctorAvailability(?)',
            [doctorId]
        );
        res.status(200).json(results[0]); // Returns an array like [{day_id: 2}, {day_id: 4}]
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.put('/availability', async (req, res) => {
    const doctorId = req.user.doctorId;
    const { dayIds } = req.body; 

    if (!Array.isArray(dayIds)) {
        return res.status(400).json({ error: 'Invalid data format. dayIds must be an array.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
  
        const dayIdsJson = JSON.stringify(dayIds);
        
   
        await connection.execute(
            'CALL sp_SetDoctorAvailability(?, ?)', 
            [doctorId, dayIdsJson]
        );

        res.status(200).json({ message: 'Availability updated successfully.' });

    } catch (error) {
        
        console.error('Error setting availability:', error);
        res.status(500).json({ error: error.message }); 
    } finally {
        if (connection) await connection.end();
    }
});
module.exports = router;