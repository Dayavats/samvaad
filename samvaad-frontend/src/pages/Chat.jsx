import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useChatSocket } from '../ChatSocketContext';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Chat() {
  const { user, token } = useAuth();
  const socket = useChatSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    if (!token) return;
    setLoadingConvs(true);
    fetch('http://localhost:5000/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setConversations(data))
      .finally(() => setLoadingConvs(false));
  }, [token]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConv || !token) return;
    setLoadingMsgs(true);
    fetch(`http://localhost:5000/conversations/${selectedConv._id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .finally(() => setLoadingMsgs(false));
  }, [selectedConv, token]);

  // Real-time receive message
  useEffect(() => {
    if (!socket) return;
    const handler = ({ message, conversationId }) => {
      if (selectedConv && conversationId === selectedConv._id) {
        setMessages(msgs => [...msgs, message]);
      }
    };
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, selectedConv]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch users for new chat
  const openUserModal = () => {
    setShowUserModal(true);
    setUserSearch('');
    fetch('http://localhost:5000/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  const handleStartChat = async (userId) => {
    setShowUserModal(false);
    // Check if conversation already exists
    const existing = conversations.find(conv =>
      conv.participants.some(p => p._id === userId)
    );
    if (existing) {
      setSelectedConv(existing);
      return;
    }
    // Create new conversation
    const res = await fetch('http://localhost:5000/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ participantId: userId })
    });
    const conv = await res.json();
    setConversations([conv, ...conversations]);
    setSelectedConv(conv);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSend = (e) => {
    e.preventDefault();
    console.log('handleSend called', newMsg, selectedConv, socket);
    if (!newMsg.trim() || !selectedConv) return;
    console.log('Emitting send_message:', {
      conversationId: selectedConv._id,
      text: newMsg
    });
    socket.emit('send_message', {
      conversationId: selectedConv._id,
      text: newMsg
    });
    setNewMsg('');
  };

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Conversations</h3>
          <button className="create-post-btn" onClick={openUserModal} title="Start New Chat">+</button>
        </div>
        {loadingConvs ? (
          <div className="chat-loading">Loading...</div>
        ) : (
          <ul className="chat-conv-list">
            {conversations.length === 0 && <li>No conversations yet.</li>}
            {conversations.map(conv => {
              const other = conv.participants.find(p => p._id !== user.id);
              return (
                <li
                  key={conv._id}
                  className={selectedConv?._id === conv._id ? 'selected' : ''}
                  onClick={() => setSelectedConv(conv)}
                >
                  <div className="chat-user-name">{other?.name || 'Unknown'}</div>
                  <div className="chat-user-role">{other?.role}</div>
                  <div className="chat-last-msg">{conv.lastMessage?.text?.slice(0, 30) || 'No messages yet.'}</div>
                </li>
              );
            })}
          </ul>
        )}
        {showUserModal && (
          <div className="chat-user-modal">
            <div className="chat-user-modal-content">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                autoFocus
              />
              <ul className="chat-user-list">
                {filteredUsers.length === 0 && <li>No users found.</li>}
                {filteredUsers.map(u => (
                  <li key={u._id} onClick={() => handleStartChat(u._id)}>
                    <span className="chat-user-name">{u.name}</span>
                    <span className="chat-user-role">{u.role}</span>
                  </li>
                ))}
              </ul>
              <button className="chat-user-modal-close" onClick={() => setShowUserModal(false)}>Close</button>
            </div>
          </div>
        )}
      </aside>
      <section className="chat-main">
        {selectedConv ? (
          <>
            <div className="chat-messages">
              {loadingMsgs ? (
                <div className="chat-loading">Loading messages...</div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg._id}
                    className={msg.sender === user.id ? 'chat-msg own' : 'chat-msg'}
                  >
                    <span className="chat-msg-author">{msg.sender === user.id ? 'You' : msg.sender?.name || 'User'}</span>
                    <span className="chat-msg-text">{msg.text}</span>
                    <span className="chat-msg-time">{formatTime(msg.createdAt)}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                disabled={!socket}
              />
              <button type="submit" disabled={!newMsg.trim() || !socket}>Send</button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">Select a conversation to start chatting.</div>
        )}
      </section>
    </div>
  );
}

export default Chat; 