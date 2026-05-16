import React from 'react';

export const OfflinePage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        marginBottom: '32px'
      }}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e94560"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18.36 6.64a9 9 0 1 0-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      </div>
      
      <h1 style={{
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '16px'
      }}>
        You're Offline
      </h1>
      
      <p style={{
        fontSize: '16px',
        opacity: 0.8,
        marginBottom: '32px',
        maxWidth: '400px',
        lineHeight: 1.6
      }}>
        It looks like you've lost your internet connection. 
        Some features may not be available until you're back online.
      </p>
      
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: '#0f3460',
            color: '#ffffff',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#16213e'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f3460'}
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 24px',
            border: '2px solid #16213e',
            backgroundColor: 'transparent',
            color: '#ffffff',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#16213e'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Go Back
        </button>
      </div>
      
      <div style={{
        marginTop: '48px',
        padding: '16px',
        backgroundColor: '#16213e',
        borderRadius: '8px',
        maxWidth: '400px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '8px',
          opacity: 0.9
        }}>
          Available Offline
        </h3>
        <ul style={{
          margin: 0,
          padding: '0 0 0 20px',
          fontSize: '14px',
          opacity: 0.7,
          textAlign: 'left'
        }}>
          <li>Cached pages and content</li>
          <li>Saved data and preferences</li>
          <li>Previously loaded resources</li>
        </ul>
      </div>
    </div>
  );
};

export default OfflinePage;
