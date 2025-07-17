import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

function Connect() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.filter(u => u._id !== user.id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUsers();
  }, [token, apiBaseUrl, user.id]);

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleStartChat = (userId) => {
    // You can navigate to chat or open a modal, depending on your app's flow
    window.location.href = `/chat?user=${userId}`;
  };

  return (
    <div className="connect-page">
      <h2>Connect with Others</h2>
      <div className="connect-controls">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="counselor">Counselors</option>
          <option value="peer">Peers</option>
        </select>
      </div>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <ul className="connect-user-list">
          {filteredUsers.length === 0 && <li>No users found.</li>}
          {filteredUsers.map(u => (
            <li key={u._id} className="connect-user-card">
              <div className="connect-user-info">
                <span className="connect-user-name">{u.name}</span>
                <span className="connect-user-role">{u.role}</span>
              </div>
              <button onClick={() => handleStartChat(u._id)}>
                Start Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Connect; 