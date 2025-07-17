import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

function Profile() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const apiBaseUrl = import.meta.env.VITE_API_URL;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProfile(data);
      setForm({ name: data.name || '', password: '' });
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          password: form.password || undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to update profile.');
      } else {
        setSuccess('Profile updated successfully!');
        setForm(f => ({ ...f, password: '' }));
        fetchProfile();
        setActionMessage('Profile updated!');
        setTimeout(() => setActionMessage(''), 1500);
      }
    } catch (err) {
      setError('Network error.');
    }
    setSaving(false);
  };

  if (loading) return <div className="profile-loading"><div className="spinner"></div>Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">Your Profile</h2>
        <form className="profile-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="profile-field-group">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="profile-input"
            />
          </div>
          <div className="profile-field-group">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>
          <div className="profile-field-group">
            <label htmlFor="profile-role">Role</label>
            <input
              id="profile-role"
              type="text"
              value={profile?.role || ''}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>
          <div className="profile-field-group">
            <label htmlFor="profile-password">New Password</label>
            <input
              id="profile-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="profile-input"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          {actionMessage && <div className="profile-action-message">{actionMessage}</div>}
          <div className="profile-actions">
            <button type="submit" className="profile-save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
      <style>{`
        .profile-page {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 60vh;
          padding: 2rem 0;
        }
        .profile-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          padding: 2rem 2.5rem;
          max-width: 400px;
          width: 100%;
        }
        .profile-title {
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .profile-field-group {
          display: flex;
          flex-direction: column;
        }
        .profile-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 1rem;
          margin-top: 0.25rem;
        }
        .profile-input-disabled {
          background: #f5f5f5;
          color: #888;
        }
        .profile-actions {
          display: flex;
          justify-content: flex-end;
        }
        .profile-save-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.6rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .profile-save-btn:disabled {
          background: #90caf9;
          cursor: not-allowed;
        }
        .form-error {
          color: #d32f2f;
          background: #ffebee;
          border-radius: 4px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .form-success {
          color: #388e3c;
          background: #e8f5e9;
          border-radius: 4px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .profile-action-message {
          background: #e8f5e9;
          color: #388e3c;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          text-align: center;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .profile-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 2rem 0;
          font-size: 1.2rem;
          color: #1976d2;
        }
        .spinner {
          border: 4px solid #e3f2fd;
          border-top: 4px solid #1976d2;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .profile-card {
            padding: 1rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile; 