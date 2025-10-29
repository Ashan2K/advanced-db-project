import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';

function AdminDashboard() {
  const [stats, setStats] = useState({ todayAppointments: 0, newPatients: 0 });
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- State for the "New Doctor" form ---
  const [docUsername, setDocUsername] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docFirstName, setDocFirstName] = useState('');
  const [docLastName, setDocLastName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docError, setDocError] = useState('');
  const [docSuccess, setDocSuccess] = useState('');

  // --- State for the "New Specialty" form ---
  const [newSpecialtyName, setNewSpecialtyName] = useState('');


  // --- Re-usable data fetching functions ---
  const fetchDoctors = useCallback(async () => {
    try {
      // We need a new endpoint to get ALL doctors
      // Let's assume we create one at '/api/admin/doctors'
      // For now, we'll just re-fetch everything
      const response = await apiClient.get('/api/admin/doctors'); // We need to create this
      setDoctors(response.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Could not load doctors.');
    }
  }, []);

  const fetchSpecialties = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/admin/specialties');
      setSpecialties(response.data);
    } catch (err) {
      console.error('Error fetching specialties:', err);
      setError('Could not load specialties.');
    }
  }, []);

  // --- Initial data load ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        const statsRes = await apiClient.get('/api/admin/dashboard');
        setStats(statsRes.data);
        
        // We'll placeholder the doctor fetch for now
        // await fetchDoctors(); 
        await fetchSpecialties();

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [fetchSpecialties]); // Removed fetchDoctors for now

  // --- Form Handlers ---
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setDocError('');
    setDocSuccess('');
    if (!docUsername || !docPassword || !docFirstName || !docLastName || !docSpecialty) {
      setDocError('All fields are required.');
      return;
    }
    try {
      const response = await apiClient.post('/api/admin/doctors', {
        username: docUsername,
        password: docPassword,
        firstName: docFirstName,
        lastName: docLastName,
        specialtyId: docSpecialty,
      });
      setDocSuccess(`Doctor ${response.data.username} created!`);
      // Clear form
      setDocUsername('');
      setDocPassword('');
      setDocFirstName('');
      setDocLastName('');
      setDocSpecialty('');
      // await fetchDoctors(); // Refresh doctor list
    } catch (err) {
      console.error('Error creating doctor:', err);
      setDocError(err.response?.data?.error || 'Failed to create doctor.');
    }
  };

  const handleAddSpecialty = async (e) => {
    e.preventDefault();
    if (!newSpecialtyName) return;
    try {
      const response = await apiClient.post('/api/admin/specialties', { name: newSpecialtyName });
      setSpecialties([...specialties, response.data]); // Add new specialty to list
      setNewSpecialtyName(''); // Clear input
    } catch (err) {
      console.error('Error adding specialty:', err);
      alert(err.response?.data?.error || 'Failed to add specialty.');
    }
  };

  // --- Render logic ---
  if (loading) return <h1>Loading Admin Dashboard...</h1>;
  if (error) return <h1 className="error-message">{error}</h1>;

  return (
    <div className="dashboard-container">
      
      {/* --- Column 1: Stats & Doctor Management --- */}
      <div className="dashboard-column-2">
        {/* Stats Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <h2>Today's Appointments</h2>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{stats.todayAppointments}</h1>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <h2>New Patients (This Month)</h2>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{stats.newPatients}</h1>
          </div>
        </div>

        {/* Doctor Management (Add) */}
        <div className="card">
          <h2>Create New Doctor Account</h2>
          <form onSubmit={handleAddDoctor}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label>First Name:</label>
                <input type="text" value={docFirstName} onChange={(e) => setDocFirstName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Last Name:</label>
                <input type="text" value={docLastName} onChange={(e) => setDocLastName(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
              <div style={{ flex: 1 }}>
                <label>Username:</label>
                <input type="text" value={docUsername} onChange={(e) => setDocUsername(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Password:</label>
                <input type="password" value={docPassword} onChange={(e) => setDocPassword(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              <label>Specialty:</label>
              <select value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)}>
                <option value="">-- Select Specialty --</option>
                {specialties.map(s => (
                  <option key={s.specialty_id} value={s.specialty_id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" style={{ marginTop: '15px' }}>Create Doctor</button>
            {docSuccess && <p className="success-message">{docSuccess}</p>}
            {docError && <p className="error-message">{docError}</p>}
          </form>
        </div>
      </div>

      {/* --- Column 2: Specialty Management --- */}
      <div className="dashboard-column-1">
        <div className="card">
          <h2>Manage Specialties</h2>
          <form onSubmit={handleAddSpecialty} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="New specialty name" 
              value={newSpecialtyName}
              onChange={(e) => setNewSpecialtyName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit">Add</button>
          </form>
          <table style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {specialties.map((s) => (
                <tr key={s.specialty_id}>
                  <td>{s.specialty_id}</td>
                  <td>{s.name}</td>
                  {/* Add delete/edit buttons here */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;