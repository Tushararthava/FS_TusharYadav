import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Message {
  _id: string;
  sender: string;
  senderUsername: string;
  content: string;
  timestamp: string;
}

const Chat: React.FC = () => {
  const { chatId } = useParams();
  const { token, anonymousUsername } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<Socket>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    // Join chat room
    socketRef.current.emit('join_chat', chatId);

    // Listen for new messages
    socketRef.current.on('receive_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/chat/${chatId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chatId, token]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/chat/${chatId}/message`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socketRef.current?.emit('send_message', {
        chatId,
        ...response.data
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="messages" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.senderUsername === anonymousUsername ? 'sent' : 'received'}`}
            style={{
              marginBottom: '10px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: message.senderUsername === anonymousUsername ? '#007bff' : '#e9ecef',
              color: message.senderUsername === anonymousUsername ? 'white' : 'black',
              alignSelf: message.senderUsername === anonymousUsername ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <div className="message-username" style={{ fontSize: '0.8em', marginBottom: '4px' }}>
              {message.senderUsername}
            </div>
            <div className="message-content">{message.content}</div>
            <div className="message-time" style={{ fontSize: '0.7em', textAlign: 'right' }}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ padding: '20px', borderTop: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ced4da' }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;