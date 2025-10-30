import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css'; 

function LoginPage() {

  const [isRegisterMode, setIsRegisterMode] = useState(false);

  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  
  const [registerUserName, setRegisterUserName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // For registration success
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        username,
        password
      });
      
      if (response.data.token) {
        login(response.data.token);
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err.response);
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:3000/auth/register', {
        username: registerUserName,
        password: registerPassword,
        firstName,
        lastName,
        email,
        phone,
        dob
      });
      
      setSuccess(response.data.message + '. Please log in.');
      setIsRegisterMode(false); 
      clearAllFields(); 

    } catch (err) {
      console.error('Registration error:', err.response);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  
  const clearAllFields = () => {
    setError('');
    setSuccess('');
    setRegisterUserName('');
    setRegisterPassword('');
    setConfirmPassword('');
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDob('');
  }

  // This function toggles the mode and clears all fields
  const toggleMode = () => {
    clearAllFields();
    setIsRegisterMode(!isRegisterMode);
    console.log('Toggling mode. isRegisterMode:', !isRegisterMode);
    
  };

  return (
    <div className="login-page__container">
      {/* This is your blue decorative side panel */}
      <div className="login-page__decorative-side">
        <span className="decorative-side__title">Medilink</span>
      </div>

      {/* This container holds the form */}
      <div className="login-container">
        
        {/* --- 1. LOGIN FORM: Only shows if isRegisterMode is FALSE --- */}
        {!isRegisterMode && (
          <form className="login-form" onSubmit={handleLogin}>
            <h1>Clinic Login</h1>
            {success && <p className="login-success">{success}</p>}
            <div>
              <label htmlFor="login-username">Username:</label>
              <input 
                id="login-username"
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="login-password">Password:</label>
              <input 
                id="login-password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button type="submit">Login</button>
            {error && <p className="login-error">{error}</p>}
            <p className="toggle-link" onClick={toggleMode}>
              Don't have an account? <strong>Register here</strong>
            </p>
          </form>
        )}

        {/* --- 2. REGISTER FORM: Only shows if isRegisterMode is TRUE --- */}
        {isRegisterMode && (
          <form className="login-form register-form" onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name:</label>
                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name:</label>
                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone:</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="dob">Date of Birth:</label>
                <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-username">Username:</label>
              <input id="register-username" type="text" value={registerUserName} onChange={(e) => setRegisterUserName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password:</label>
              <input id="register-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="register-confirm-password">Re-enter Password:</label>
              <input id="register-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit">Register</button>
            {error && <p className="login-error">{error}</p>}
            <p className="toggle-link" onClick={toggleMode}>
              Already have an account? <strong>Login here</strong>
            </p>
          </form>
        )}
        

      </div>
    </div>
  );
}

export default LoginPage;