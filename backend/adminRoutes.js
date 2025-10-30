const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dbConfig = require('./dbConfig');
const { checkAuth, checkRole } = require('./authMiddleware');

const router = express.Router();


router.use(checkAuth, checkRole(['Admin']));


router.get('/dashboard', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [stats] = await connection.query(
            'SELECT fn_CountAppointmentsToday() AS todayAppointments, fn_CountNewPatientsThisMonth() AS newPatients'
        );
        res.status(200).json(stats[0]);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.get('/specialties', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM Specialties ORDER BY name');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.post('/specialties', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.query(
            'INSERT INTO Specialties (name) VALUES (?)', 
            [name]
        );
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.post('/doctors', async (req, res) => {
    const { username, password, firstName, lastName, specialtyId } = req.body;
    if (!username || !password || !firstName || !lastName || !specialtyId) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    let connection;
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_AdminCreateDoctor(?, ?, ?, ?, ?)';
        const params = [username, passwordHash, firstName, lastName, specialtyId];
        
        const [results] = await connection.execute(sql, params);
        res.status(201).json(results[0][0]); 

    } catch (error) {
        console.error('Error creating doctor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists.' });
        }
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});


router.delete('/doctors/:id', async (req, res) => {
    const { id: doctorId } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute(
            'CALL sp_AdminDeactivateDoctor(?)', 
            [doctorId]
        );
        res.status(200).json(results[0][0]);
    } catch (error) {
        console.error('Error deactivating doctor:', error);
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
            `SELECT * FROM v_DoctorList ORDER BY last_name`
        );
       
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(5.00).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;