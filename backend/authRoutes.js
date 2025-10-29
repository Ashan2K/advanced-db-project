const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const dbConfig = require('./dbConfig'); 

const router = express.Router();


const JWT_SECRET = 'jwt_secret_key';


router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, email, phone, dob } = req.body;

    
    if (!username || !password || !firstName || !lastName || !email) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    let connection;
    try {
       
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

   
        connection = await mysql.createConnection(dbConfig);
        const sql = 'CALL sp_RegisterPatient(?, ?, ?, ?, ?, ?, ?)';
        const params = [username, passwordHash, firstName, lastName, email, phone, dob];
        
        const [results] = await connection.execute(sql, params);

        res.status(201).json({ 
            message: 'Patient registered successfully', 
            data: results[0][0] 
        });

    } catch (error) {
        console.error('Registration error:', error);
    
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username or email already exists.' });
        }
        res.status(500).json({ error: 'Database error during registration.' });
    } finally {
        if (connection) await connection.end();
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
   
        const [results] = await connection.execute('CALL sp_LoginUser(?)', [username]);
        const user = results[0][0];
        console.log(user);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

      

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }


        const payload = {
            user: {
                id: user.user_id,
                role: user.role,
                patientId: user.linked_patient_id,
                doctorId: user.linked_doctor_id
            }
        };

        const token = jwt.sign(
            payload, 
            JWT_SECRET, 
            { expiresIn: '24h' } 
        );

       
        res.status(200).json({ 
            message: 'Login successful',
            token: token,
            role: user.role
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;