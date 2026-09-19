import React, { useState, useContext, useEffect } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { loggedInContext } from '../context/logedInStatus';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { loggedIn, logIn } = useContext(loggedInContext);

  useEffect(() => {
    if (loggedIn) {
      navigate('/');
    }
  }, [loggedIn, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter your email/username and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier.trim(),
          name: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        logIn(data.user);
        navigate('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Could not connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="login-container">
        <div className="auth-header">
          <div className="auth-logo">📒</div>
          <h1>Udhar Khata</h1>
          <p className="auth-subtitle">Sign in to manage your financial ledger</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="identifier">Email or Name</label>
            <input
              id="identifier"
              type="text"
              placeholder="e.g. waqas or email@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-auth">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="link-text">
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Create one now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;