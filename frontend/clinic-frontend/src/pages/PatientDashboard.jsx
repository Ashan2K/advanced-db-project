import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/DashBoardPage.css';

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

 
  const [doctors, setDoctors] = useState([]); 
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentTime, setAppointmentTime] = useState(''); 
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');


  const [isDoctorListLoading, setIsDoctorListLoading] = useState(false);

  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileError, setProfileError] = useState('');

  
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  
  const fetchAppointments = useCallback(async () => {
    try {
      const appointmentsResponse = await apiClient.get('/api/me/appointments');
      setAppointments(appointmentsResponse.data);
    } catch (err) { console.error('Error fetching appointments:', err); }
  }, []);

  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
       
        const profileResponse = await apiClient.get('/api/me/profile');
        setProfile(profileResponse.data);
        setFormData(profileResponse.data);

        const recordsResponse = await apiClient.get('/api/me/medicalrecords');
        setMedicalRecords(recordsResponse.data);

        await fetchAppointments();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, fetchAppointments]);

  
  useEffect(() => {
    
    const fetchAvailableDoctors = async () => {
      
      if (!appointmentTime) {
        setDoctors([]);
        setSelectedDoctor('');
        return;
      }

      
      const datePart = appointmentTime.split('T')[0];
      
      setIsDoctorListLoading(true);
      setDoctors([]); 
      setSelectedDoctor(''); 
      setBookError(''); 

      try {
        
        const response = await apiClient.get(`/api/me/doctors?date=${datePart}`);
        setDoctors(response.data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setBookError('Could not load doctors for that day.');
      } finally {
        setIsDoctorListLoading(false);
      }
    };

    fetchAvailableDoctors();
  }, [appointmentTime]);

  

  const handleProfileUpdate = async (e) => { e.preventDefault(); setProfileError(''); try { const response = await apiClient.put('/api/me/profile', formData); setProfile(response.data); setFormData(response.data); setIsEditing(false); } catch (err) { console.error('Profile update error:', err); setProfileError(err.response?.data?.error || 'Failed to save profile.'); } };
  const handleBookAppointment = async (e) => { e.preventDefault(); setBookError(''); setBookSuccess(''); if (!selectedDoctor || !appointmentTime) { setBookError('Please select a doctor and a date/time.'); return; } try { const response = await apiClient.post('/api/me/book-appointment', { doctorId: selectedDoctor, appointmentTime: appointmentTime, }); setBookSuccess(response.data.message); setSelectedDoctor(''); setAppointmentTime(''); await fetchAppointments(); } catch (err) { console.error('Booking error:', err); setBookError(err.response?.data?.error || 'Failed to book appointment.'); } };
  const handleCancelAppointment = async (appointmentId) => { if (!window.confirm('Are you sure you want to cancel this appointment?')) { return; } try { await apiClient.put(`/api/me/appointments/${appointmentId}/cancel`); await fetchAppointments(); } catch (err) { console.error('Error cancelling appointment:', err); alert(err.response?.data?.error || 'Failed to cancel appointment.'); } };
  const handleFormChange = (e) => { const value = e.target.type === 'date' ? e.target.value.split('T')[0] : e.target.value; setFormData({ ...formData, [e.target.name]: value }); };
  const handleEditCancel = () => { setFormData(profile); setIsEditing(false); setProfileError(''); };
  const toggleRecordNotes = (recordId) => { if (expandedRecordId === recordId) { setExpandedRecordId(null); } else { setExpandedRecordId(recordId); } };


  if (loading) return <h1>Loading your dashboard...</h1>;
  if (error) return <h1 className="error-message">{error}</h1>;

  // --- 2. UPDATED JSX (RETURN BLOCK) ---
  return (
    <div className="dashboard-container">
      
      {/* --- Column 1: Profile & Booking --- */}
      <div className="dashboard-column-1">
        
        {/* --- Profile Card (Unchanged) --- */}
        <div className="card">
          {isEditing ? (
            <form onSubmit={handleProfileUpdate}> <h2>Edit Your Profile</h2> {/*... (edit form) ...*/} <div className="form-group"> <label>First Name:</label> <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleFormChange} /> </div> <div className="form-group"> <label>Last Name:</label> <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleFormChange} /> </div> <div className="form-group"> <label>Email:</label> <input type="email" name="email" value={formData.email || ''} onChange={handleFormChange} /> </div> <div className="form-group"> <label>Phone:</label> <input type="tel" name="phone" value={formData.phone || ''} onChange={handleFormChange} /> </div> <div className="form-group"> <label>Date of Birth:</label> <input type="date" name="dob" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleFormChange} /> </div> {profileError && <p className="error-message">{profileError}</p>} <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}> <button type="submit" style={{ flex: 1 }}>Save Changes</button> <button type="button" className="cancel-btn" onClick={handleEditCancel} style={{ flex: 1 }}>Cancel</button> </div> </form>
          ) : (
            <> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <h2>Welcome, {profile?.first_name}!</h2> <button onClick={() => setIsEditing(true)} style={{padding: '5px 10px', fontSize: '0.8rem'}}>Edit</button> </div> <p><strong>Email:</strong> {profile?.email}</p> <p><strong>Phone:</strong> {profile?.phone}</p> <p><strong>Age:</strong> {profile?.age}</p> </>
          )}
        </div>

        {/* --- Booking Form Card (Updated) --- */}
        <div className="card">
          <h2>Book a New Appointment</h2>
          <form onSubmit={handleBookAppointment}>
            {/* 1. Date/Time Input (Now controls the doctor list) */}
            <div style={{ marginBottom: '15px' }}>
              <label>Select Date and Time:</label>
              <input 
                type="datetime-local"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                // Set min to prevent booking in the past
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {/* 2. Doctor Select (Now dynamic) */}
            <div>
              <label>Select Doctor:</label>
              <select 
                value={selectedDoctor} 
                onChange={(e) => setSelectedDoctor(e.target.value)}
                // Disable until a date is picked or if loading
                disabled={isDoctorListLoading || !appointmentTime}
              >
                {/* Dynamic default option */}
                <option value="">
                  {isDoctorListLoading ? 'Loading doctors...' :
                   !appointmentTime ? 'Select a date first' :
                   doctors.length === 0 ? 'No doctors available on this day' :
                   '-- Please select a doctor --'}
                </option>
                
                {doctors.map((doc) => (
                  <option key={doc.doctor_id} value={doc.doctor_id}>
                    Dr. {doc.first_name} {doc.last_name} ({doc.specialty})
                  </option>
                ))}
              </select>
            </div>
            
            <button type="submit" style={{ marginTop: '15px' }}>
              Book Now
            </button>
            {bookSuccess && <p className="success-message">{bookSuccess}</p>}
            {bookError && <p className="error-message">{bookError}</p>}
          </form>
        </div>
      </div>

      {/* --- Column 2: Appointments & Medical History --- */}
      <div className="dashboard-column-2">
        {/* --- Appointments List Card (Unchanged) --- */}
        <div className="card">
          <h2>My Appointments</h2>
          {appointments.length === 0 ? ( <p>You have no appointments scheduled.</p> ) : ( <table> <thead> <tr> <th>Date & Time</th> <th>Doctor</th> <th>Specialty</th> <th>Status</th> <th>Action</th> </tr> </thead> <tbody> {appointments.map((app) => ( <tr key={app.appointment_id}> <td>{new Date(app.appointment_time).toLocaleString()}</td> <td>{app.doctor_name}</td> <td>{app.specialty}</td> <td> <span className={`status status-${app.status}`}> {app.status} </span> </td> <td> <button className="cancel-btn" onClick={() => handleCancelAppointment(app.appointment_id)} disabled={app.status !== 'Scheduled'} > Cancel </button> </td> </tr> ))} </tbody> </table> )}
        </div>

        {/* --- Medical History Card (Unchanged) --- */}
        <div className="card">
          <h2>My Medical History</h2>
          <div className="table-container" style={{ maxHeight: '400px' }}>
            {medicalRecords.length === 0 ? ( <p>No medical records found.</p> ) : ( <table> <thead> <tr> <th>Date</th> <th>Doctor</th> <th>Diagnosis</th> <th>Notes</th> </tr> </thead> <tbody> {medicalRecords.map((record) => ( <React.Fragment key={record.record_id}> <tr> <td>{new Date(record.visit_date).toLocaleDateString()}</td> <td>{record.doctor_name}</td> <td>{record.diagnosis}</td> <td> <button className="notes-toggle-btn" onClick={() => toggleRecordNotes(record.record_id)} > {expandedRecordId === record.record_id ? 'Hide' : 'View'} </button> </td> </tr> {expandedRecordId === record.record_id && ( <tr className="record-notes-row"> <td colSpan="4"> <strong>Notes:</strong> {record.notes || 'No notes provided.'} </td> </tr> )} </React.Fragment> ))} </tbody> </table> )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;