import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal'; 

function DoctorDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null); 
  const [patientRecords, setPatientRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [recordError, setRecordError] = useState('');
  const [recordSuccess, setRecordSuccess] = useState('');


  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/doctor/schedule');
      setSchedule(response.data);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [user, fetchSchedule]);

  const handleCompleteAppointment = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    try {
      await apiClient.put(`/api/doctor/appointments/${appointmentId}/complete`);
      setSchedule(prevSchedule => 
        prevSchedule.filter(app => app.appointment_id !== appointmentId)
      );
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
        <div style={{ flex: 1 }}>
          <div className="card">
            <h2>My Upcoming Schedule</h2>
            {schedule.length === 0 ? (
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
                  {schedule.map((app) => (
                    <tr key={app.appointment_id}>
                      <td>{new Date(app.appointment_time).toLocaleString()}</td>
                      <td>{app.patient_name}</td>
                      <td>{app.patient_phone}</td>
                      <td style={{ display: 'flex', gap: '10px' }}>
                        
                        <button 
                          className="cancel-btn" 
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
            {/* Column 1: Past Records */}
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
            
            {/* Column 2: Add New Record Form */}
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