import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/DashBoardPage.css'

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

  // Re-usable function to fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const appointmentsResponse = await apiClient.get('/api/me/appointments');
      setAppointments(appointmentsResponse.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments.');
    }
  }, []); // Empty dependency array

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const profileResponse = await apiClient.get('/api/me/profile');
        setProfile(profileResponse.data);

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
    e.preventDefault();
    setBookError('');
    setBookSuccess('');
    if (!selectedDoctor || !appointmentTime) {
      setBookError('Please select a doctor and a date/time.');
      return;
    }
    try {
      const response = await apiClient.post('/api/me/book-appointment', {
        doctorId: selectedDoctor,
        appointmentTime: appointmentTime,
      });
      setBookSuccess(response.data.message);
      setSelectedDoctor('');
      setAppointmentTime('');
      await fetchAppointments(); // Refresh the list!
    } catch (err) {
      console.error('Booking error:', err);
      setBookError(err.response?.data?.error || 'Failed to book appointment.');
    }
  };

  // --- 1. NEW: Handler for the Cancel Button ---
  const handleCancelAppointment = async (appointmentId) => {
    // Show a confirmation dialog
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      // Call the API endpoint
      const response = await apiClient.put(`/api/me/appointments/${appointmentId}/cancel`);
      console.log(response.data.message); // e.g., "Appointment cancelled successfully."
      
      // Refresh the appointments list to show the new "Cancelled" status
      await fetchAppointments();

    } catch (err) {
      console.error('Error cancelling appointment:', err);
      // Show the error from the backend (e.g., "Forbidden")
      alert(err.response?.data?.error || 'Failed to cancel appointment.');
    }
  };


  // --- Render logic ---
  if (loading) return <h1>Loading your dashboard...</h1>;
  if (error) return <h1 className="error-message">{error}</h1>;

  return (
    // --- 2. Use the new CSS classes ---
    <div className="dashboard-container">
      
      {/* Column 1: Profile & Booking */}
      <div className="dashboard-column-1">
        {profile && (
          <div className="card">
            <h2>Welcome, {profile.first_name}!</h2>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Age:</strong> {profile.age}</p>
          </div>
        )}

        <div className="card">
          <h2>Book a New Appointment</h2>
          <form onSubmit={handleBookAppointment}>
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
            <div>
              <label>Select Date and Time:</label>
              <input 
                type="datetime-local"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
            <button type="submit">Book Now</button>
            {bookSuccess && <p className="success-message">{bookSuccess}</p>}
            {bookError && <p className="error-message">{bookError}</p>}
          </form>
        </div>
      </div>

      {/* Column 2: Appointments List */}
      <div className="dashboard-column-2">
        <div className="card">
          <h2>My Appointments</h2>
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
                  <th>Action</th> {/* 3. Add new table header */}
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app.appointment_id}>
                    <td>{new Date(app.appointment_time).toLocaleString()}</td>
                    <td>{app.doctor_name}</td>
                    <td>{app.specialty}</td>
                    <td>
                      {/* Use dynamic class for status badges */}
                      <span className={`status status-${app.status}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      {/* 4. Add the button and logic */}
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelAppointment(app.appointment_id)}
                        // Disable the button if it's not "Scheduled"
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