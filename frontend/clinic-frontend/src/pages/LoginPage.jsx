import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css'; 

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="login-page__container">
      <div className="login-page__decorative-side">
        {/* Added Medilink text here */}
        <span className="decorative-side__title">Medilink</span>
      </div>
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h1>Clinic Login</h1>
          <div>
            <label htmlFor="username">Username:</label>
            <input 
              id="username"
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit">Login</button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
export default LoginPage;