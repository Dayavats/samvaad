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
      }
    } catch (err) {
      setError('Network error.');
    }
    setSaving(false);
  };

  if (loading) return <div className="feed-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={profile?.email || ''}
            disabled
          />
        </label>
        <label>
          Role
          <input
            type="text"
            value={profile?.role || ''}
            disabled
          />
        </label>
        <label>
          New Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  );
}

export default Profile; 