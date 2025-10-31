import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';

import Modal from '../components/Modal';
import '../styles/adminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({ todayAppointments: 0, newPatients: 0 });
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const [patients, setPatients] = useState([]);

  const [docUsername, setDocUsername] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docFirstName, setDocFirstName] = useState('');
  const [docLastName, setDocLastName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docError, setDocError] = useState('');
  const [docSuccess, setDocSuccess] = useState('');
  
  const [newSpecialtyName, setNewSpecialtyName] = useState('');
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/admin/patients');
      setPatients(response.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Could not load patients.');
    }
  }, []);

  const fetchDoctors = useCallback(async () => { 
    try {
      const response = await apiClient.get('/api/admin/doctors');
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

 
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        const statsRes = await apiClient.get('/api/admin/dashboard');
        setStats(statsRes.data);
        await fetchSpecialties();
        await fetchDoctors();
        await fetchPatients(); 
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [fetchSpecialties, fetchDoctors, fetchPatients]); 

 
  const handleAddDoctor = async (e) => { e.preventDefault(); setDocError(''); setDocSuccess(''); if (!docUsername || !docPassword || !docFirstName || !docLastName || !docSpecialty) { setDocError('All fields are required.'); return; } try { const response = await apiClient.post('/api/admin/doctors', { username: docUsername, password: docPassword, firstName: docFirstName, lastName: docLastName, specialtyId: docSpecialty, }); setDocSuccess(`Doctor ${response.data.username} created!`); setDocUsername(''); setDocPassword(''); setDocFirstName(''); setDocLastName(''); setDocSpecialty(''); await fetchDoctors(); } catch (err) { console.error('Error creating doctor:', err); setDocError(err.response?.data?.error || 'Failed to create doctor.'); } };
  const handleAddSpecialty = async (e) => { e.preventDefault(); if (!newSpecialtyName) return; try { const response = await apiClient.post('/api/admin/specialties', { name: newSpecialtyName }); setSpecialties([...specialties, response.data]); setNewSpecialtyName(''); } catch (err) { console.error('Error adding specialty:', err); alert(err.response?.data?.error || 'Failed to add specialty.'); } };
  const handleDeleteSpecialty = async (specialtyId) => { if (!window.confirm('Are you sure you want to delete this specialty? This cannot be undone.')) { return; } try { await apiClient.delete(`/api/admin/specialties/${specialtyId}`); setSpecialties(specialties.filter(s => s.specialty_id !== specialtyId)); } catch (err) { console.error('Error deleting specialty:', err); alert(err.response?.data?.error || 'Failed to delete specialty.'); } };
  const handleToggleDoctorStatus = async (doctor) => { const { doctor_id, is_active } = doctor; const action = is_active ? 'deactivate' : 'activate'; if (!window.confirm(`Are you sure you want to ${action} this doctor?`)) { return; } try { if (is_active) { await apiClient.delete(`/api/admin/doctors/${doctor_id}`); } else { await apiClient.put(`/api/admin/doctors/${doctor_id}/activate`); } await fetchDoctors(); } catch (err) { console.error(`Error ${action}ing doctor:`, err); alert(err.response?.data?.error || `Failed to ${action} doctor.`); } };

 
  const handleTogglePatientStatus = async (patient) => {
    const { patient_id, status } = patient;
    const action = (status === 'active') ? 'deactivate' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${action} this patient's account?`)) {
      return;
    }

    try {
      if (status === 'active') {
        await apiClient.delete(`/api/admin/patients/${patient_id}`);
      } else {
        await apiClient.put(`/api/admin/patients/${patient_id}/activate`);
      }
      await fetchPatients(); 
    } catch (err) {
      console.error(`Error ${action}ing patient:`, err);
      alert(err.response?.data?.error || `Failed to ${action} patient.`);
    }
  };


  if (loading) return <h1>Loading Admin Dashboard...</h1>;
  if (error) return <h1 className="error-message">{error}</h1>;

  return (
    <>
      <div className="dashboard-container">
        
        {/* --- Column 1: Side Content --- */}
        <div className="dashboard-column-side">
          {/* ... (Stats, Admin Tools, Create Doctor cards are unchanged) ... */}
          <div className="stats-container">
            <div className="stats-card"> <h2>Today's Appointments</h2> <p className="stat-number">{stats.todayAppointments}</p> </div>
            <div className="stats-card"> <h2>New Patients</h2> <p className="stat-number">{stats.newPatients}</p> </div>
          </div>
          <div className="card">
            <h2>Admin Tools</h2>
            <p>Manage specialties and other clinic settings.</p>
            <button onClick={() => setIsSpecialtyModalOpen(true)} style={{width: '100%'}}> Manage Specialties </button>
          </div>
          <div className="card">
            <h2>Create New Doctor Account</h2>
            <form onSubmit={handleAddDoctor}>
              <div className="form-row"> <div className="form-group"> <label>First Name:</label> <input type="text" value={docFirstName} onChange={(e) => setDocFirstName(e.target.value)} /> </div> <div className="form-group"> <label>Last Name:</label> <input type="text" value={docLastName} onChange={(e) => setDocLastName(e.target.value)} /> </div> </div>
              <div className="form-row"> <div className="form-group"> <label>Username:</label> <input type="text" value={docUsername} onChange={(e) => setDocUsername(e.target.value)} /> </div> <div className="form-group"> <label>Password:</label> <input type="password" value={docPassword} onChange={(e) => setDocPassword(e.target.value)} /> </div> </div>
              <div className="form-group"> <label>Specialty:</label> <select value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)}> <option value="">-- Select Specialty --</option> {specialties.map(s => ( <option key={s.specialty_id} value={s.specialty_id}>{s.name}</option> ))} </select> </div>
              <button type="submit">Create Doctor</button>
              {docSuccess && <p className="success-message">{docSuccess}</p>}
              {docError && <p className="error-message">{docError}</p>}
            </form>
          </div>
        </div>

        {/* --- Column 2: Main Content (Doctors & Patients) --- */}
        <div className="dashboard-column-main">
          {/* Doctor List Table */}
          <div className="card">
            <h2>Manage Doctors</h2>
            {/* ... (Doctor table is unchanged) ... */}
            <div className="table-container"> 
              <table>
                <thead> <tr> <th>Name</th> <th>Specialty</th> <th>Status</th> <th>Action</th> </tr> </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.doctor_id}>
                      <td>Dr. {doc.first_name} {doc.last_name}</td> <td>{doc.specialty}</td>
                      <td> <span className={`status-badge ${doc.is_active ? 'status-Active' : 'status-Inactive'}`}> {doc.is_active ? 'Active' : 'Inactive'} </span> </td>
                      <td> {doc.is_active ? ( <button className="action-button" onClick={() => handleToggleDoctorStatus(doc)}> Deactivate </button> ) : ( <button className="activate-btn" onClick={() => handleToggleDoctorStatus(doc)}> Activate </button> )} </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- 5. NEW: Patient List Table --- */}
          <div className="card">
            <h2>Manage Patients</h2>
            <div className="table-container"> 
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td>{patient.first_name} {patient.last_name}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone}</td>
                      <td>
                        <span className={`status-badge ${patient.status === 'active' ? 'status-Active' : 'status-Inactive'}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td>
                        {patient.status === 'active' ? (
                          <button 
                            className="action-button" // Red "Deactivate"
                            onClick={() => handleTogglePatientStatus(patient)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            className="activate-btn" // Green "Activate"
                            onClick={() => handleTogglePatientStatus(patient)}
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* --- Specialty Modal (Unchanged) --- */}
      <Modal isOpen={isSpecialtyModalOpen} onClose={() => setIsSpecialtyModalOpen(false)} title="Manage Specialties">
        {/* ... (modal content is unchanged) ... */}
        <form onSubmit={handleAddSpecialty} className="form-flex-container"> <input type="text" placeholder="New specialty name" value={newSpecialtyName} onChange={(e) => setNewSpecialtyName(e.target.value)} /> <button type="submit">Add</button> </form>
        <div className="table-container" style={{ marginTop: '20px' }}> 
          <table>
            <thead> <tr> <th>ID</th> <th>Name</th> <th>Action</th> </tr> </thead>
            <tbody>
              {specialties.map((s) => (
                <tr key={s.specialty_id}>
                  <td>{s.specialty_id}</td> <td>{s.name}</td>
                  <td> <button className="delete-btn" onClick={() => handleDeleteSpecialty(s.specialty_id)}> Delete </button> </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}

export default AdminDashboard;