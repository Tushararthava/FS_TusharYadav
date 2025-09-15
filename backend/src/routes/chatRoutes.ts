import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import Chat from '../models/Chat';

const router = express.Router();

// Initialize chat with another user
router.post('/start', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { otherUserId } = req.body;
    
    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: {
        $all: [req.user.userId, otherUserId]
      }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const newChat = new Chat({
      participants: [req.user.userId, otherUserId],
      messages: []
    });

    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's chats
router.get('/my-chats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const chats = await Chat.find({
      participants: req.user.userId
    }).populate('participants', 'anonymousUsername');
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat messages
router.get('/:chatId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/message', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = {
      sender: req.user.userId,
      senderUsername: req.user.anonymousUsername,
      content,
      timestamp: new Date()
    };

    chat.messages.push(message);
    await chat.save();

    // The actual message sending will be handled by Socket.IO
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;