import React, { useState, useEffect } from 'react';
import { Auth, API } from 'aws-amplify';

const Dashboard = ({ user, signOut }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
    fetchDocuments();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await API.get('dms-api', '/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserInfo(response);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      const response = await API.get('dms-api', '/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDocuments(response.items || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = () => {
    const groups = user?.signInUserSession?.idToken?.payload['cognito:groups'] || [];
    return Array.isArray(groups) ? groups : [groups].filter(Boolean);
  };

  const isAdmin = () => getUserRoles().includes('Admin');
  const isVendor = () => getUserRoles().includes('Vendor');

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Document Management System</h1>
        <div className="user-info">
          <span>Welcome, {user.attributes?.email}</span>
          <span className="roles">Roles: {getUserRoles().join(', ') || 'User'}</span>
          <button onClick={signOut} className="sign-out-btn">Sign Out</button>
        </div>
      </header>

      <main className="main-content">
        <div className="stats">
          <div className="stat-card">
            <h3>Total Documents</h3>
            <p>{documents.length}</p>
          </div>
          <div className="stat-card">
            <h3>User ID</h3>
            <p>{userInfo?.userId?.substring(0, 8)}...</p>
          </div>
          <div className="stat-card">
            <h3>Access Level</h3>
            <p>{isAdmin() ? 'Admin' : isVendor() ? 'Vendor' : 'User'}</p>
          </div>
        </div>

        <div className="features">
          <div className="feature-section">
            <h2>📄 Document Management</h2>
            <div className="feature-buttons">
              <button className="feature-btn">Upload Document</button>
              <button className="feature-btn">View Documents</button>
              <button className="feature-btn">Search Documents</button>
            </div>
          </div>

          {isVendor() && (
            <div className="feature-section">
              <h2>🏢 Vendor Features</h2>
              <div className="feature-buttons">
                <button className="feature-btn">Manage Users</button>
                <button className="feature-btn">View Statistics</button>
                <button className="feature-btn">Vendor Documents</button>
              </div>
            </div>
          )}

          {isAdmin() && (
            <div className="feature-section">
              <h2>👑 Admin Features</h2>
              <div className="feature-buttons">
                <button className="feature-btn">Manage All Users</button>
                <button className="feature-btn">View Audit Logs</button>
                <button className="feature-btn">System Settings</button>
              </div>
            </div>
          )}
        </div>

        <div className="recent-documents">
          <h2>Recent Documents</h2>
          {documents.length > 0 ? (
            <div className="document-list">
              {documents.slice(0, 5).map((doc, index) => (
                <div key={index} className="document-item">
                  <span className="doc-name">{doc.name || 'Untitled'}</span>
                  <span className="doc-date">{doc.created_at || 'Unknown'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No documents found</p>
          )}
        </div>
      </main>

      <style jsx>{`
        .dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          background: #f5f5f5;
        }
        .header {
          background: #232f3e;
          color: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }
        .roles {
          font-size: 0.9rem;
          color: #ffa500;
        }
        .sign-out-btn {
          background: #ff4757;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .main-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-card h3 {
          margin: 0 0 0.5rem 0;
          color: #666;
          font-size: 0.9rem;
        }
        .stat-card p {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #232f3e;
        }
        .features {
          margin-bottom: 2rem;
        }
        .feature-section {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        .feature-section h2 {
          margin: 0 0 1rem 0;
          color: #232f3e;
        }
        .feature-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .feature-btn {
          background: #ff9500;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .feature-btn:hover {
          background: #e8860d;
        }
        .recent-documents {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .recent-documents h2 {
          margin: 0 0 1rem 0;
          color: #232f3e;
        }
        .document-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .document-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 4px;
        }
        .doc-name {
          font-weight: 500;
        }
        .doc-date {
          color: #666;
          font-size: 0.9rem;
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
