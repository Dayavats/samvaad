import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const ROLE_ORDER = ['broken', 'counselor', 'admin'];

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // user id or post/story id for which action is in progress
  const [showFlaggedPosts, setShowFlaggedPosts] = useState(false);
  const [showFlaggedStories, setShowFlaggedStories] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [storySearch, setStorySearch] = useState('');
  const [postsLoading, setPostsLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  // Pagination state
  const [postPage, setPostPage] = useState(1);
  const [storyPage, setStoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const apiBaseUrl = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await fetch(`${apiBaseUrl}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);
      const res = await fetch(`${apiBaseUrl}/stories`);
      if (!res.ok) throw new Error('Failed to fetch stories');
      const data = await res.json();
      setStories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setStoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPosts();
    fetchStories();
    // eslint-disable-next-line
  }, [token]);

  const handlePromote = async (user) => {
    const nextRole = ROLE_ORDER[ROLE_ORDER.indexOf(user.role) + 1];
    if (!window.confirm(`Promote ${user.name} to ${nextRole}?`)) return;
    setActionLoading(user._id);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${user._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error('Failed to promote user');
      await fetchUsers();
      setSuccess(`Promoted ${user.name} to ${nextRole}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (user) => {
    const prevRole = ROLE_ORDER[ROLE_ORDER.indexOf(user.role) - 1];
    if (!window.confirm(`Demote ${user.name} to ${prevRole}?`)) return;
    setActionLoading(user._id);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${user._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: prevRole }),
      });
      if (!res.ok) throw new Error('Failed to demote user');
      await fetchUsers();
      setSuccess(`Demoted ${user.name} to ${prevRole}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanToggle = async (user) => {
    if (!window.confirm(`${user.banned ? 'Unban' : 'Ban'} ${user.name}?`)) return;
    setActionLoading(user._id);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${user._id}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ banned: !user.banned }),
      });
      if (!res.ok) throw new Error('Failed to update ban status');
      await fetchUsers();
      setSuccess(`${user.banned ? 'Unbanned' : 'Banned'} ${user.name}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Placeholder delete handlers
  const handleDeletePost = async (post) => {
    if (!window.confirm(`Delete post by ${post.author ? post.author.name : 'Unknown'}?`)) return;
    setActionLoading(post._id);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/posts/${post._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete post');
      await fetchPosts();
      setSuccess(`Deleted post by ${post.author ? post.author.name : 'Unknown'}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };
  const handleDeleteStory = async (story) => {
    if (!window.confirm(`Delete story by ${story.isAnonymous ? 'Anonymous' : (story.author ? story.author.name : 'Unknown')}?`)) return;
    setActionLoading(story._id);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/stories/${story._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete story');
      await fetchStories();
      setSuccess(`Deleted story by ${story.isAnonymous ? 'Anonymous' : (story.author ? story.author.name : 'Unknown')}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlagPost = async (post, flagged) => {
    if (!window.confirm(`${flagged ? 'Flag' : 'Approve'} post by ${post.author ? post.author.name : 'Unknown'}?`)) return;
    setActionLoading(post._id + '-flag');
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/posts/${post._id}/flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flagged }),
      });
      if (!res.ok) throw new Error('Failed to update flag status');
      await fetchPosts();
      setSuccess(`${flagged ? 'Flagged' : 'Approved'} post by ${post.author ? post.author.name : 'Unknown'}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };
  const handleFlagStory = async (story, flagged) => {
    if (!window.confirm(`${flagged ? 'Flag' : 'Approve'} story by ${story.isAnonymous ? 'Anonymous' : (story.author ? story.author.name : 'Unknown')}?`)) return;
    setActionLoading(story._id + '-flag');
    setSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/stories/${story._id}/flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flagged }),
      });
      if (!res.ok) throw new Error('Failed to update flag status');
      await fetchStories();
      setSuccess(`${flagged ? 'Flagged' : 'Approved'} story by ${story.isAnonymous ? 'Anonymous' : (story.author ? story.author.name : 'Unknown')}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Add styles at the top of the file (or in a <style> tag in the return if you prefer)
  const tableStyles = {
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' },
    th: { background: '#f5f5f5', borderBottom: '2px solid #1976d2', padding: '8px', textAlign: 'left' },
    td: { padding: '8px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    trEven: { background: '#fafbfc' },
    trOdd: { background: '#f0f4f8' },
    trHover: { background: '#e3f2fd' },
  };

  // Add responsive styles at the top of the file
  const responsiveStyles = `
@media (max-width: 900px) {
  .admin-table-wrapper { overflow-x: auto; }
  .admin-table { min-width: 600px; }
}
@media (max-width: 600px) {
  .admin-controls { display: flex; flex-direction: column; gap: 8px; }
  .admin-table { font-size: 0.95em; }
  .admin-table th, .admin-table td { padding: 6px; }
  .admin-table { min-width: 400px; }
}
`;

  // Compute analytics
  const totalUsers = users.length;
  const bannedUsers = users.filter(u => u.banned).length;
  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const totalPosts = posts.length;
  const flaggedPosts = posts.filter(p => p.flagged).length;
  const totalStories = stories.length;
  const flaggedStories = stories.filter(s => s.flagged).length;

  // Compute posts per day and flagged posts per day
  function getPostsPerDay(posts) {
    const counts = {};
    posts.forEach(post => {
      const day = new Date(post.createdAt).toISOString().slice(0, 10);
      if (!counts[day]) counts[day] = { date: day, total: 0, flagged: 0 };
      counts[day].total++;
      if (post.flagged) counts[day].flagged++;
    });
    return Object.values(counts).sort((a, b) => a.date.localeCompare(b.date));
  }
  const postsPerDay = getPostsPerDay(posts);

  return (
    <div style={{ padding: '2rem' }}>
      <style>{responsiveStyles}</style>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin! Here you can manage users, posts, and stories.</p>
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, margin: '16px 0 32px 0' }}>
        <div style={{ minWidth: 160, background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
          <strong>Users:</strong><br />
          Total: {totalUsers}<br />
          Banned: {bannedUsers}<br />
          Broken: {roleCounts.broken || 0}<br />
          Counselor: {roleCounts.counselor || 0}<br />
          Admin: {roleCounts.admin || 0}
        </div>
        <div style={{ minWidth: 160, background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
          <strong>Posts:</strong><br />
          Total: {totalPosts}<br />
          Flagged: {flaggedPosts}
        </div>
        <div style={{ minWidth: 160, background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
          <strong>Stories:</strong><br />
          Total: {totalStories}<br />
          Flagged: {flaggedStories}
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 600, margin: '0 0 32px 0' }}>
        <h3 style={{ margin: '8px 0' }}>Posts per Day</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={postsPerDay} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#1976d2" name="Total Posts" strokeWidth={2} />
            <Line type="monotone" dataKey="flagged" stroke="#d32f2f" name="Flagged Posts" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <h2>Users</h2>
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Name</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Email</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Role</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id || user.email} style={user.banned ? { opacity: 0.5 } : {}}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {user.role !== 'admin' && ROLE_ORDER.indexOf(user.role) < ROLE_ORDER.length - 1 && (
                  <button onClick={() => handlePromote(user)} style={{ marginRight: 8 }} disabled={actionLoading === user._id}>Promote</button>
                )}
                {user.role !== 'broken' && ROLE_ORDER.indexOf(user.role) > 0 && (
                  <button onClick={() => handleDemote(user)} style={{ marginRight: 8 }} disabled={actionLoading === user._id}>Demote</button>
                )}
                <button onClick={() => handleBanToggle(user)} style={{ marginRight: 8 }} disabled={actionLoading === user._id}>
                  {user.banned ? 'Unban' : 'Ban'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Posts</h2>
      <div className="admin-controls">
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={showFlaggedPosts} onChange={e => setShowFlaggedPosts(e.target.checked)} /> Show only flagged
        </label>
        <input
          type="text"
          placeholder="Search posts by author or content..."
          value={postSearch}
          onChange={e => setPostSearch(e.target.value)}
          style={{ marginBottom: 12, width: '100%', padding: 4 }}
        />
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table" style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Author</th>
              <th style={tableStyles.th}>Content</th>
              <th style={tableStyles.th}>Date</th>
              <th style={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          {/* Pagination logic for posts */}
          {(() => {
            const filteredPosts = (showFlaggedPosts ? posts.filter(p => p.flagged) : posts)
              .filter(post => {
                const author = post.author ? post.author.name.toLowerCase() : '';
                const text = post.text ? post.text.toLowerCase() : '';
                return (
                  author.includes(postSearch.toLowerCase()) ||
                  text.includes(postSearch.toLowerCase())
                );
              });
            const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;
            const pagedPosts = filteredPosts.slice((postPage - 1) * ITEMS_PER_PAGE, postPage * ITEMS_PER_PAGE);
            return <>
              <tbody>
                {pagedPosts.map((post, idx) => (
                  <tr
                    key={post._id}
                    style={idx % 2 === 0 ? tableStyles.trEven : tableStyles.trOdd}
                    onMouseOver={e => e.currentTarget.style.background = tableStyles.trHover.background}
                    onMouseOut={e => e.currentTarget.style.background = (idx % 2 === 0 ? tableStyles.trEven.background : tableStyles.trOdd.background)}
                  >
                    <td style={tableStyles.td}>{post.author ? post.author.name : 'Unknown'} ({post.author ? post.author.role : ''})</td>
                    <td style={tableStyles.td} title={post.text}>{post.text}</td>
                    <td style={tableStyles.td}>{new Date(post.createdAt).toLocaleString()}</td>
                    <td style={tableStyles.td}>
                      <span style={{ color: post.flagged ? 'red' : 'inherit', fontWeight: post.flagged ? 'bold' : 'normal' }}>
                        {post.flagged ? 'Flagged' : ''}
                      </span>
                      <button onClick={() => handleFlagPost(post, !post.flagged)} disabled={actionLoading === post._id + '-flag'} style={{ marginLeft: 8 }}>
                        {post.flagged ? 'Approve' : 'Flag'}
                      </button>
                      <button onClick={() => handleDeletePost(post)} disabled={actionLoading === post._id} style={{ marginLeft: 8 }}>
                        {actionLoading === post._id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 8 }}>
                    <button onClick={() => setPostPage(p => Math.max(1, p - 1))} disabled={postPage === 1}>Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPostPage(i + 1)}
                        style={{ fontWeight: postPage === i + 1 ? 'bold' : 'normal', margin: '0 2px' }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setPostPage(p => Math.min(totalPages, p + 1))} disabled={postPage === totalPages}>Next</button>
                  </td>
                </tr>
              </tfoot>
            </>;
          })()}
        </table>
      </div>
      <h2>Stories</h2>
      <div className="admin-controls">
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={showFlaggedStories} onChange={e => setShowFlaggedStories(e.target.checked)} /> Show only flagged
        </label>
        <input
          type="text"
          placeholder="Search stories by author or content..."
          value={storySearch}
          onChange={e => setStorySearch(e.target.value)}
          style={{ marginBottom: 12, width: '100%', padding: 4 }}
        />
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table" style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Author</th>
              <th style={tableStyles.th}>Content</th>
              <th style={tableStyles.th}>Date</th>
              <th style={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          {/* Pagination logic for stories */}
          {(() => {
            const filteredStories = (showFlaggedStories ? stories.filter(s => s.flagged) : stories)
              .filter(story => {
                const author = story.isAnonymous ? 'anonymous' : (story.author ? story.author.name.toLowerCase() : '');
                const text = story.text ? story.text.toLowerCase() : '';
                return (
                  author.includes(storySearch.toLowerCase()) ||
                  text.includes(storySearch.toLowerCase())
                );
              });
            const totalPages = Math.ceil(filteredStories.length / ITEMS_PER_PAGE) || 1;
            const pagedStories = filteredStories.slice((storyPage - 1) * ITEMS_PER_PAGE, storyPage * ITEMS_PER_PAGE);
            return <>
              <tbody>
                {pagedStories.map((story, idx) => (
                  <tr
                    key={story._id}
                    style={idx % 2 === 0 ? tableStyles.trEven : tableStyles.trOdd}
                    onMouseOver={e => e.currentTarget.style.background = tableStyles.trHover.background}
                    onMouseOut={e => e.currentTarget.style.background = (idx % 2 === 0 ? tableStyles.trEven.background : tableStyles.trOdd.background)}
                  >
                    <td style={tableStyles.td}>{story.isAnonymous ? 'Anonymous' : (story.author ? story.author.name : 'Unknown')} {story.author ? `(${story.author.role})` : ''}</td>
                    <td style={tableStyles.td} title={story.text}>{story.text}</td>
                    <td style={tableStyles.td}>{new Date(story.createdAt).toLocaleString()}</td>
                    <td style={tableStyles.td}>
                      <span style={{ color: story.flagged ? 'red' : 'inherit', fontWeight: story.flagged ? 'bold' : 'normal' }}>
                        {story.flagged ? 'Flagged' : ''}
                      </span>
                      <button onClick={() => handleFlagStory(story, !story.flagged)} disabled={actionLoading === story._id + '-flag'} style={{ marginLeft: 8 }}>
                        {story.flagged ? 'Approve' : 'Flag'}
                      </button>
                      <button onClick={() => handleDeleteStory(story)} disabled={actionLoading === story._id} style={{ marginLeft: 8 }}>
                        {actionLoading === story._id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 8 }}>
                    <button onClick={() => setStoryPage(p => Math.max(1, p - 1))} disabled={storyPage === 1}>Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setStoryPage(i + 1)}
                        style={{ fontWeight: storyPage === i + 1 ? 'bold' : 'normal', margin: '0 2px' }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setStoryPage(p => Math.min(totalPages, p + 1))} disabled={storyPage === totalPages}>Next</button>
                  </td>
                </tr>
              </tfoot>
            </>;
          })()}
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard; 