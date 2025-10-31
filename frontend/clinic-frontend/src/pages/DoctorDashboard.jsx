import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

// Static array of weekdays (1=Sunday, 2=Monday, etc.)
const weekdays = [
  { id: 2, name: 'Monday' },
  { id: 3, name: 'Tuesday' },
  { id: 4, name: 'Wednesday' },
  { id: 5, name: 'Thursday' },
  { id: 6, name: 'Friday' },
  { id: 7, name: 'Saturday' },
  { id: 1, name: 'Sunday' },
];

function DoctorDashboard() {
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [completedSchedule, setCompletedSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // State for Availability
  const [availability, setAvailability] = useState(new Set());
  const [availSuccess, setAvailSuccess] = useState('');

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [recordError, setRecordError] = useState('');
  const [recordSuccess, setRecordSuccess] = useState('');


  const fetchSchedule = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/doctor/schedule');
      const allAppointments = response.data;
      
      const upcoming = allAppointments
        .filter(app => app.status === 'Scheduled')
        .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));
      
      const completed = allAppointments
        .filter(app => app.status === 'Completed')
        .sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time));

      setUpcomingSchedule(upcoming);
      setCompletedSchedule(completed);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule.');
    }
  }, []);

  const fetchAvailability = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/doctor/availability');
      const dayIdSet = new Set(response.data.map(d => d.day_id));
      setAvailability(dayIdSet);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability settings.');
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      await Promise.all([
        fetchSchedule(),
        fetchAvailability()
      ]);
      setLoading(false);
    };
    fetchAllData();
  }, [user, fetchSchedule, fetchAvailability]);

  // --- THIS FUNCTION ALREADY WORKS ---
  // It correctly sends the `{ dayIds: ... }` JSON
  // that your new stored procedure (sp_SetDoctorAvailability)
  // is expecting. No change is needed here.
  const handleSaveAvailability = async () => {
    setAvailSuccess('');
    setError('');
    try {
      const dayIds = Array.from(availability);
      const response = await apiClient.put('/api/doctor/availability', { dayIds });
      setAvailSuccess(response.data.message);
    } catch (err) {
      console.error('Error saving availability:', err);
      setError(err.response?.data?.error || 'Failed to save availability.');
    }
  };

  const handleAvailabilityChange = (dayId) => {
    setAvailability(prev => {
      const newAvailability = new Set(prev);
      if (newAvailability.has(dayId)) {
        newAvailability.delete(dayId);
      } else {
        newAvailability.add(dayId);
      }
      return newAvailability;
    });
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    try {
      await apiClient.put(`/api/doctor/appointments/${appointmentId}/complete`);
      await fetchSchedule();
    } catch (err) {
      console.error('Error completing appointment:', err);
      alert(err.response?.data?.error || 'Failed to complete appointment.');
    }
  };

  const handleOpenRecords = async (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
    setRecordsLoading(true);
    setRecordError('');
    setRecordSuccess('');
    setNewDiagnosis('');
    setNewNotes('');
    try {
      const response = await apiClient.get(`/api/doctor/patients/${patient.id}/records`);
      setPatientRecords(response.data);
    } catch (err) {
      console.error('Error fetching records:', err);
      setRecordError('Could not load patient records.');
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setRecordError('');
    setRecordSuccess('');
    if (!newDiagnosis) {
      setRecordError('Diagnosis is required.');
      return;
    }
    try {
      const response = await apiClient.post('/api/doctor/records', {
        patientId: selectedPatient.id,
        visitDate: new Date().toISOString(),
        diagnosis: newDiagnosis,
        notes: newNotes,
      });
      setRecordSuccess(response.data.message);
      setPatientRecords(prevRecords => [response.data, ...prevRecords]);
      setNewDiagnosis('');
      setNewNotes('');
    } catch (err) {
      console.error('Error adding record:', err);
      setRecordError(err.response?.data?.error || 'Failed to add record.');
    }
  };

  if (loading) return <h1>Loading your schedule...</h1>;
  if (error) return <h1 className="error-message">{error}</h1>;

  return (
    <>
      <div className="dashboard-container">
        
        <div className="dashboard-column-side">
          <div className="card">
            <h2>My Weekly Availability</h2>
            <p>Select the days you are available for appointments.</p>
            <div className="form-group">
              {weekdays.map(day => (
                <div key={day.id} style={{ marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    id={`day-${day.id}`}
                    checked={availability.has(day.id)}
                    onChange={() => handleAvailabilityChange(day.id)}
                    style={{ marginRight: '10px' }}
                  />
                  <label htmlFor={`day-${day.id}`}>{day.name}</label>
                </div>
              ))}
            </div>
            <button onClick={handleSaveAvailability} style={{ width: '100%' }}>
              Save Availability
            </button>
            {availSuccess && <p className="success-message" style={{marginTop: '10px'}}>{availSuccess}</p>}
          </div>
        </div>

        <div className="dashboard-column-main">
          <div className="card">
            <h2>My Upcoming Schedule</h2>
            {upcomingSchedule.length === 0 ? (
              <p>You have no upcoming appointments.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Patient Name</th>
                    <th>Patient Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSchedule.map((app) => (
                    <tr key={app.appointment_id}>
                      <td>{new Date(app.appointment_time).toLocaleString()}</td>
                      <td>{app.patient_name}</td>
                      <td>{app.patient_phone}</td>
                      <td style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="notes-toggle-btn"
                          onClick={() => handleOpenRecords({ id: app.patient_id, name: app.patient_name })}
                        >
                          View/Add Records
                        </button>
                        <button 
                          onClick={() => handleCompleteAppointment(app.appointment_id)}
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2>My Completed Appointments</h2>
            {completedSchedule.length === 0 ? (
              <p>You have no completed appointments.</p>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Patient Name</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSchedule.map((app) => (
                      <tr key={app.appointment_id}>
                        <td>{new Date(app.appointment_time).toLocaleString()}</td>
                        <td>{app.patient_name}</td>
                        <td>
                          <span className="status-badge status-Completed">
                            {app.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="notes-toggle-btn"
                            onClick={() => handleOpenRecords({ id: app.patient_id, name: app.patient_name })}
                          >
                            View Records
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Medical Records for: ${selectedPatient?.name}`}
      >
        {recordsLoading ? (
          <p>Loading records...</p>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <h4>Past Records</h4>
              {patientRecords.length === 0 ? (
                <p>No past records found.</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {patientRecords.map(record => (
                    <div key={record.record_id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                      <strong>{new Date(record.visit_date).toLocaleDateString()}</strong>: {record.diagnosis}
                      <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>{record.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
              <h4>Add New Record</h4>
              <form onSubmit={handleAddRecord}>
                <div>
                  <label>Diagnosis:</label>
                  <input 
                    type="text" 
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                  />
                </div>
                <div>
                  <label>Notes:</label>
                  <textarea 
                    rows="5"
                    style={{ width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit">Add Record</button>
                {recordSuccess && <p className="success-message">{recordSuccess}</p>}
                {recordError && <p className="error-message">{recordError}</p>}
              </form>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default DoctorDashboard;