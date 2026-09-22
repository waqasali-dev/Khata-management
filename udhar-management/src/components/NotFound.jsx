import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbf9fa',
        color: '#1b1c1d',
        fontFamily: 'Inter, sans-serif',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '4rem', margin: 0, color: '#115cb9' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem 0' }}>Page Not Found</h2>
      <p style={{ color: '#44474c', maxWidth: '400px', marginBottom: '1.5rem' }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        style={{
          backgroundColor: '#041627',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
