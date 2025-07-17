import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

function Feed() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ text: '', image: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);

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

  if (loading) {
    return <div className="feed-loading">Loading posts...</div>;
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
                <span className="likes-count">{post.likes?.length || 0} likes</span>
                <span className="comments-count">{post.comments?.length || 0} comments</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;