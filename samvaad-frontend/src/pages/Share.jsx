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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Share; 