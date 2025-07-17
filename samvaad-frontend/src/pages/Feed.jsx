import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

function Feed() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ text: '', image: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState({}); // postId -> text
  const [actionMessage, setActionMessage] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL;

  // Fetch posts from backend
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/posts`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.text.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newPost.text,
          image: newPost.image || undefined,
          tags: newPost.tags ? newPost.tags.split(',').map(tag => tag.trim()) : []
        })
      });

      if (response.ok) {
        const createdPost = await response.json();
        setPosts([createdPost, ...posts]);
        setNewPost({ text: '', image: '', tags: '' });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId) => {
    await fetch(`${apiBaseUrl}/posts/${postId}/like`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    setActionMessage('Post liked!');
    setTimeout(() => setActionMessage(''), 1500);
    fetchPosts();
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId]) return;
    await fetch(`${apiBaseUrl}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: commentText[postId] })
    });
    setCommentText((prev) => ({ ...prev, [postId]: '' }));
    setActionMessage('Comment added!');
    setTimeout(() => setActionMessage(''), 1500);
    fetchPosts();
  };

  const handleFlagPost = async (postId) => {
    await fetch(`${apiBaseUrl}/posts/${postId}/flag`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ flagged: true })
    });
    setActionMessage('Thanks for reporting!');
    setTimeout(() => setActionMessage(''), 1500);
    fetchPosts();
  };

  if (loading) {
    return <div className="feed-loading"><div className="spinner"></div>Loading posts...</div>;
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>Motivational Feed</h2>
        {user && (
          <button 
            className="create-post-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Post'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <form className="create-post-form" onSubmit={handleCreatePost}>
          <textarea
            placeholder="Share something motivational..."
            value={newPost.text}
            onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={newPost.image}
            onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
          />
          <input
            type="text"
            placeholder="Tags (comma separated, e.g., motivation, hope)"
            value={newPost.tags}
            onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}

      {actionMessage && <div className="feed-action-message">{actionMessage}</div>}

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">No posts yet. Be the first to share something motivational!</div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <strong>{post.author?.name || 'Anonymous'}</strong>
                  <span className="post-role">{post.author?.role}</span>
                </div>
                <span className="post-time">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="post-content">
                <p>{post.text}</p>
                {post.image && (
                  <img src={post.image} alt="Post" className="post-image" />
                )}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="post-actions">
                <button onClick={() => handleLikePost(post._id)} className="feed-like-btn">
                  {post.likes && user && post.likes.includes(user.id) ? 'Unlike' : 'Like'}
                </button>
                <span>{post.likes?.length || 0} likes</span>
                {/* Comments */}
                <ul className="feed-comments">
                  {post.comments && post.comments.map(c => (
                    <li key={c._id || c.createdAt}>
                      <b>{c.author?.name || 'User'}:</b> {c.text}
                    </li>
                  ))}
                </ul>
                <form onSubmit={e => { e.preventDefault(); handleAddComment(post._id); }} className="feed-comment-form">
                  <input
                    value={commentText[post._id] || ''}
                    onChange={e => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                    placeholder="Add a comment..."
                  />
                  <button type="submit" className="feed-comment-btn">Comment</button>
                </form>
                {user && user.role !== 'admin' && !post.flagged && (
                  <button onClick={() => handleFlagPost(post._id)} className="feed-flag-btn">Report</button>
                )}
                {post.flagged && <span className="feed-flagged">Flagged</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;

<style>{`
.feed-like-btn, .feed-comment-btn, .feed-flag-btn {
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
.feed-like-btn:hover, .feed-comment-btn:hover, .feed-flag-btn:hover {
  background: #1976d2;
  color: #fff;
}
.feed-action-message {
  background: #e8f5e9;
  color: #388e3c;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.feed-loading {
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