import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface Message {
  chatId: string;
  sender: string;
  senderUsername: string;
  content: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: Message[];
  sendMessage: (chatId: string, content: string) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  isConnected: boolean;
  error: string | null;
}

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useChat = (): UseChatReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, anonymousUsername } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      setIsConnected(false);
      setError('Failed to connect to chat server');
      console.error('Socket connection error:', err);
    });

    newSocket.on('receive_message', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (!socket || !isConnected) {
      setError('Not connected to chat server');
      return;
    }

    const message = {
      chatId,
      sender: anonymousUsername,
      content,
      timestamp: new Date()
    };

    socket.emit('send_message', message);
  }, [socket, isConnected, anonymousUsername]);

  const joinChat = useCallback((chatId: string) => {
    if (!socket || !isConnected) {
      setError('Not connected to chat server');
      return;
    }

    socket.emit('join_chat', chatId);
    // Clear previous messages when joining a new chat
    setMessages([]);
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('leave_chat', chatId);
    setMessages([]);
  }, [socket, isConnected]);

  return {
    messages,
    sendMessage,
    joinChat,
    leaveChat,
    isConnected,
    error
  };
};