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

  // --- 1. NEW STATE FOR EDITING ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({}); // To hold edit form data
  const [profileError, setProfileError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      const appointmentsResponse = await apiClient.get('/api/me/appointments');
      setAppointments(appointmentsResponse.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments.');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const profileResponse = await apiClient.get('/api/me/profile');
        setProfile(profileResponse.data);
        setFormData(profileResponse.data); // <-- Pre-fill form data

        const doctorsResponse = await apiClient.get('/api/me/doctors');
        setDoctors(doctorsResponse.data);

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

  const handleBookAppointment = async (e) => {
    // ... (this function is unchanged)
    e.preventDefault();
    setBookError('');
    setBookSuccess('');
    if (!selectedDoctor || !appointmentTime) {
      setBookError('Please select a doctor and a date/time.');
      return;
    }
    try {
      const response = await apiClient.post('/api/me/appointments', {
        doctorId: selectedDoctor,
        appointmentTime: appointmentTime,
      });
      setBookSuccess(response.data.message);
      setSelectedDoctor('');
      setAppointmentTime('');
      await fetchAppointments(); 
    } catch (err) {
      console.error('Booking error:', err);
      setBookError(err.response?.data?.error || 'Failed to book appointment.');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    // ... (this function is unchanged)
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      await apiClient.put(`/api/me/appointments/${appointmentId}/cancel`);
      await fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert(err.response?.data?.error || 'Failed to cancel appointment.');
    }
  };
  
  // --- 2. NEW: HANDLERS FOR PROFILE EDITING ---

  // Update form state as user types
  const handleFormChange = (e) => {
    // Handle 'date' input type which needs YYYY-MM-DD
    const value = e.target.type === 'date' 
      ? e.target.value.split('T')[0] 
      : e.target.value;
      
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  // Handle the "Save" button click
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      // Send the updated data to the backend
      const response = await apiClient.put('/api/me/profile', formData);
      
      // Update the profile state with the new data from the server
      setProfile(response.data); 
      setFormData(response.data); // Re-sync form data
      setIsEditing(false); // Close the edit form

    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err.response?.data?.error || 'Failed to save profile.');
    }
  };

  // Handle the "Cancel" button click
  const handleEditCancel = () => {
    setFormData(profile); // Reset form data back to original
    setIsEditing(false);
    setProfileError('');
  };

  // --- Render logic ---
  if (loading) return <h1>Loading your dashboard...</h1>;
  if (error) return <h1 className="error-message">{error}</h1>;

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-column-1">
        
        {/* --- 3. UPDATED PROFILE CARD --- */}
        <div className="card">
          {/* This is a ternary operator: (condition ? if_true : if_false) */}
          {isEditing ? (
            // --- EDIT MODE ---
            <form onSubmit={handleProfileUpdate}>
              <h2>Edit Your Profile</h2>
              <div className="form-group">
                <label>First Name:</label>
                <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Last Name:</label>
                <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Date of Birth:</label>
                {/* Format date for input[type=date] */}
                <input type="date" name="dob" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleFormChange} />
              </div>
              {profileError && <p className="error-message">{profileError}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="cancel-btn" onClick={handleEditCancel} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          ) : (
            // --- VIEW MODE ---
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Welcome, {profile?.first_name}!</h2>
                <button onClick={() => setIsEditing(true)} style={{padding: '5px 10px', fontSize: '0.8rem'}}>Edit</button>
              </div>
              <p><strong>Email:</strong> {profile?.email}</p>
              <p><strong>Phone:</strong> {profile?.phone}</p>
              <p><strong>Age:</strong> {profile?.age}</p>
            </>
          )}
        </div>

        {/* --- Booking Form Card (Unchanged) --- */}
        <div className="card">
          <h2>Book a New Appointment</h2>
          <form onSubmit={handleBookAppointment}>
            {/* ... (booking form) ... */}
            <div>
              <label>Select Doctor:</label>
              <select 
                value={selectedDoctor} 
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <option value="">-- Please select a doctor --</option>
                {doctors.map((doc) => (
                  <option key={doc.doctor_id} value={doc.doctor_id}>
                    Dr. {doc.first_name} {doc.last_name} ({doc.specialty})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>Select Date and Time:</label>
              <input 
                type="datetime-local"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
            <button type="submit" style={{ marginTop: '15px' }}>
              Book Now
            </button>
            {bookSuccess && <p className="success-message">{bookSuccess}</p>}
            {bookError && <p className="error-message">{bookError}</p>}
          </form>
        </div>
      </div>

      {/* --- Appointments List Column (Unchanged) --- */}
      <div className="dashboard-column-2">
        <div className="card">
          <h2>My Appointments</h2>
          {/* ... (table) ... */}
          {appointments.length === 0 ? (
            <p>You have no appointments scheduled.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app.appointment_id}>
                    <td>{new Date(app.appointment_time).toLocaleString()}</td>
                    <td>{app.doctor_name}</td>
                    <td>{app.specialty}</td>
                    <td>
                      <span className={`status status-${app.status}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelAppointment(app.appointment_id)}
                        disabled={app.status !== 'Scheduled'}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;