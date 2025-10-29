
const express = require('express');
const dbConfig = require('./dbConfig'); 
const cors = require('cors');

const authRoutes = require('./authRoutes'); 
const { checkAuth, checkRole } = require('./authMiddleware');
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const adminRoutes = require('./adminRoutes');


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); 


app.use('/auth', authRoutes);
app.use('/api/me', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Clinic API is running!');
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});