// src/components/GmailConnectionTest.tsx
"use client";

import { useGmail } from "../context/gmailContext";

export const GmailConnectionTest = () => {
  const { isConnected, email, isLoading, error, connectGmail, disconnectGmail } = useGmail();

  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    maxWidth: '400px',
    margin: '2rem auto',
    fontFamily: 'sans-serif',
    textAlign: 'center'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#0070f3',
    color: 'white',
    margin: '10px 0'
  };

  const disconnectButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e53e3e',
  };

  const statusStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: '5px',
    margin: '10px 0',
  };

  const connectedStatusStyle: React.CSSProperties = {
    ...statusStyle,
    backgroundColor: '#e6fffa',
    border: '1px solid #38a169',
    color: '#2f855a'
  };

  const disconnectedStatusStyle: React.CSSProperties = {
    ...statusStyle,
    backgroundColor: '#fff5f5',
    border: '1px solid #e53e3e',
    color: '#c53030'
  };

  const errorStyle: React.CSSProperties = {
    color: '#c53030',
    marginTop: '10px'
  }

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <p>Loading Gmail Status...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2>Gmail Integration Test</h2>
      {error && <p style={errorStyle}>Error: {error}</p>}

      {isConnected ? (
        <div>
          <div style={connectedStatusStyle}>
            <p><strong>Status:</strong> Connected</p>
            <p><strong>Email:</strong> {email}</p>
          </div>
          <button style={disconnectButtonStyle} onClick={disconnectGmail} disabled={isLoading}>
            Disconnect Gmail
          </button>
        </div>
      ) : (
        <div>
          <div style={disconnectedStatusStyle}>
            <p><strong>Status:</strong> Not Connected</p>
          </div>
          <button style={buttonStyle} onClick={connectGmail} disabled={isLoading}>
            Connect Gmail Account
          </button>
        </div>
      )}
    </div>
  );
};