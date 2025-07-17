import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

function Share() {
  const { user, token } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ text: '', tags: '', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const apiBaseUrl = import.meta.env.VITE_API_URL;

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/stories`);
      const data = await res.json();
      setStories(data);
    } catch (err) {
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.text.trim()) {
      setError('Story text is required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: form.text,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
          isAnonymous: form.isAnonymous
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to submit story.');
      } else {
        setSuccess('Story shared successfully!');
        setForm({ text: '', tags: '', isAnonymous: false });
        fetchStories();
      }
    } catch (err) {
      setError('Network error.');
    }
    setSubmitting(false);
  };

  const handleFlagStory = async (storyId) => {
    await fetch(`${apiBaseUrl}/stories/${storyId}/flag`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ flagged: true })
    });
    setActionMessage('Thanks for reporting!');
    setTimeout(() => setActionMessage(''), 1500);
    fetchStories();
  };

  if (loading) {
    return <div className="share-loading"><div className="spinner"></div>Loading stories...</div>;
  }

  return (
    <div className="share-container">
      <h2>Share Your Story</h2>
      {user && (
        <form className="share-form" onSubmit={handleSubmit}>
          <textarea
            name="text"
            placeholder="Share your experience..."
            value={form.text}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="tags"
            placeholder="Tags (comma separated, e.g., hope, recovery)"
            value={form.tags}
            onChange={handleChange}
          />
          <label className="share-anon-label">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleChange}
            />
            Share anonymously
          </label>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <button type="submit" disabled={submitting}>{submitting ? 'Sharing...' : 'Share Story'}</button>
        </form>
      )}
      {!user && <div className="share-login-msg">Please log in to share your story.</div>}
      {actionMessage && <div className="share-action-message">{actionMessage}</div>}
      <div className="stories-list">
        <h3>Stories from the Community</h3>
        {loading ? (
          <div className="feed-loading">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="no-posts">No stories yet. Be the first to share!</div>
        ) : (
          stories.map(story => (
            <div key={story._id} className="story-card">
              <div className="story-header">
                <span className="story-author">
                  {story.isAnonymous || !story.author ? 'Anonymous' : story.author.name}
                </span>
                <span className="story-time">
                  {new Date(story.createdAt).toLocaleDateString()} {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="story-text">{story.text}</div>
              {story.tags && story.tags.length > 0 && (
                <div className="story-tags">
                  {story.tags.map((tag, idx) => (
                    <span key={idx} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
              {user && user.role !== 'admin' && !story.flagged && (
                <button onClick={() => handleFlagStory(story._id)} className="story-flag-btn">Report</button>
              )}
              {story.flagged && <span className="story-flagged">Flagged</span>}
            </div>
          ))
        )}
      </div>
      <style>{`
.story-flag-btn {
  margin: 0 6px 0 0;
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.story-flag-btn:hover {
  background: #1976d2;
  color: #fff;
}
.share-action-message {
  background: #e8f5e9;
  color: #388e3c;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.share-loading {
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
`}</style>
    </div>
  );
}

export default Share; 