import React from 'react';

export const SimpleAmplifyLogin: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#232f3e', marginBottom: '1rem' }}>
          Document Management System
        </h1>
        <p style={{ color: '#687078', marginBottom: '2rem' }}>
          Secure document management for your organization
        </p>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email or Username"
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <input 
            type="password" 
            placeholder="Password"
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '0.75rem',
              background: '#ff9500',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Sign In
          </button>
        </form>
        
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#687078' }}>
          <p>Test Account: admin@test.com / AdminPass123!</p>
          <p>Powered by AWS Amplify</p>
        </div>
      </div>
    </div>
  );
};
