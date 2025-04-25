const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const Notification = require('../models/Notification');

let io;
const userSockets = new Map(); // Maps userId to socketId

const initializeSocket = (server) => {
  console.log('[SocketService] Initializing socket server...');
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization"]
    },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      console.log('[SocketService] Authenticating socket connection...');
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        console.log('[SocketService] No token provided');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('[SocketService] User not found for token');
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id;
      socket.user = {
        id: user._id,
        name: user.name,
        email: user.email
      };
      
      console.log(`[SocketService] User authenticated: ${user.name} (${user._id})`);
      return next();
    } catch (error) {
      console.error('[SocketService] Authentication error:', error);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SocketService] User connected: ${socket.userId} (socket ID: ${socket.id})`);
    
    // Store the socket connection
    userSockets.set(socket.userId, socket.id);
    console.log(`[SocketService] Current connected users:`, Array.from(userSockets.keys()));
    
    // Join user to their own room
    socket.join(socket.userId);
    console.log(`[SocketService] User joined their room: ${socket.userId}`);
    
    // Handle room joining
    socket.on('joinRoom', ({ roomId }) => {
      console.log(`[SocketService] User ${socket.userId} joining room: ${roomId}`);
      socket.join(roomId);
    });
    
    // Handle test event
    socket.on('test', (data) => {
      console.log('[SocketService] Test event received:', data);
      socket.emit('testResponse', { message: 'Test successful', userId: socket.userId });
    });
    
    // Join user to rooms for their teams and projects
    joinUserRooms(socket);
    
    // Handle chat messages
    socket.on('sendMessage', async (data) => {
      handleChatMessage(socket, data);
    });
    
    // Handle notification read status
    socket.on('markNotificationsRead', (data) => {
      handleMarkNotificationsRead(socket, data);
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      handleTypingIndicator(socket, data, true);
    });
    
    socket.on('stopTyping', (data) => {
      handleTypingIndicator(socket, data, false);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[SocketService] User disconnected: ${socket.userId} (socket ID: ${socket.id})`);
      userSockets.delete(socket.userId);
      console.log(`[SocketService] Remaining connected users:`, Array.from(userSockets.keys()));
    });
  });

  return io;
};

// Join user to all their rooms
const joinUserRooms = async (socket) => {
  try {
    const user = await User.findById(socket.userId)
      .populate('teams', '_id')
      .populate('projects', '_id')
      .populate('friendChats', '_id');
      
    // Join team rooms
    user.teams.forEach(team => {
      socket.join(`team:${team._id}`);
    });
    
    // Join project rooms
    user.projects.forEach(project => {
      socket.join(`project:${project._id}`);
    });
    
    // Join friend chat rooms
    user.friendChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });
    
  } catch (error) {
    console.error('Error joining user rooms:', error);
  }
};

// Handle chat message
const handleChatMessage = async (socket, data) => {
  try {
    const { chatId, chatType, message } = data;
    
    if (!chatId || !chatType || !message) {
      return;
    }
    
    let roomId;
    let model;
    
    switch (chatType) {
      case 'friend':
        roomId = `chat:${chatId}`;
        model = require('../models/FriendChat');
        break;
      case 'team':
        roomId = `team:${chatId}`;
        model = require('../models/TeamChat');
        break;
      case 'project':
        roomId = `project:${chatId}`;
        model = require('../models/ProjectChat');
        break;
      default:
        return;
    }
    
    const chat = await model.findById(chatId);
    if (!chat) return;
    
    // Add message to chat
    const newMessage = {
      sender: socket.userId,
      content: message,
      timestamp: new Date(),
      read: false
    };
    
    chat.messages.push(newMessage);
    chat.lastMessageAt = new Date();
    await chat.save();
    
    // Emit to all users in the room
    io.to(roomId).emit('newMessage', {
      chatId,
      chatType,
      message: {
        ...newMessage,
        sender: {
          _id: socket.user.id,
          name: socket.user.name
        }
      }
    });
    
    // Create notifications for recipients
    let recipients = [];
    
    if (chatType === 'friend') {
      // For friend chat, notify the other participant
      recipients = chat.participants.filter(p => p.toString() !== socket.userId.toString());
    } else if (chatType === 'team') {
      // For team chat, need to get team members
      const Team = require('../models/Team');
      const team = await Team.findById(chatId);
      if (team) {
        recipients = team.members.filter(m => m.toString() !== socket.userId.toString());
      }
    } else if (chatType === 'project') {
      // For project chat, need to get project members
      const Project = require('../models/Project');
      const project = await Project.findById(chatId);
      if (project) {
        recipients = project.members.map(m => m.user).filter(u => u.toString() !== socket.userId.toString());
      }
    }
    
    // Send notifications to all recipients
    for (const recipientId of recipients) {
      const notification = {
        recipient: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `${socket.user.name} sent you a message${chatType !== 'friend' ? ` in ${chatType} chat` : ''}`,
        read: false,
        relatedUser: socket.userId,
        link: `/chat/${chatType}/${chatId}`,
        metadata: {
          chatId,
          chatType,
          messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        }
      };
      
      const newNotification = await createNotification(notification);
      
      if (newNotification) {
        const recipientSocketId = userSockets.get(recipientId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('newNotification', newNotification);
        }
      }
    }
    
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
};

// Handle marking notifications as read
const handleMarkNotificationsRead = async (socket, data) => {
  try {
    const { all, notificationIds } = data;
    
    const Notification = require('../models/Notification');
    
    if (all) {
      await Notification.updateMany(
        { recipient: socket.userId, read: false },
        { $set: { read: true } }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { recipient: socket.userId, _id: { $in: notificationIds } },
        { $set: { read: true } }
      );
    }
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: socket.userId, 
      read: false 
    });
    
    // Emit updated unread count to the user
    io.to(socket.userId).emit('notificationCountUpdated', { unreadCount });
    
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

// Handle typing indicator
const handleTypingIndicator = (socket, data, isTyping) => {
  try {
    const { chatId, chatType } = data;
    
    if (!chatId || !chatType) {
      return;
    }
    
    let roomId;
    
    switch (chatType) {
      case 'friend':
        roomId = `chat:${chatId}`;
        break;
      case 'team':
        roomId = `team:${chatId}`;
        break;
      case 'project':
        roomId = `project:${chatId}`;
        break;
      default:
        return;
    }
    
    // Emit typing event to all users in the room except sender
    socket.to(roomId).emit(isTyping ? 'userTyping' : 'userStoppedTyping', {
      chatId,
      chatType,
      user: {
        _id: socket.user.id,
        name: socket.user.name
      }
    });
    
  } catch (error) {
    console.error('Error handling typing indicator:', error);
  }
};

// Send notification to specific user(s)
const sendNotification = async (notification) => {
  try {
    console.log('[SocketService] Creating notification:', notification);
    const newNotification = await createNotification(notification);
    
    if (newNotification) {
      const roomId = notification.recipient.toString();
      console.log('[SocketService] Emitting to room:', roomId);
      
      // Check if room exists
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        console.log(`[SocketService] Room ${roomId} has ${room.size} clients`);
        
        // Emit to the room
        io.to(roomId).emit('newNotification', newNotification);
        console.log('[SocketService] Notification emitted to room');
        
        // Update unread count
        const unreadCount = await Notification.countDocuments({ 
          recipient: notification.recipient, 
          read: false 
        });
        console.log('[SocketService] Emitting notificationCountUpdated:', unreadCount);
        io.to(roomId).emit('notificationCountUpdated', { unreadCount });
      } else {
        console.log('[SocketService] No clients in room:', roomId);
        // Store notification for when user reconnects
        return newNotification;
      }
    } else {
      console.error('[SocketService] Failed to create notification');
      return null;
    }
    
    return newNotification;
  } catch (error) {
    console.error('[SocketService] Error sending notification:', error);
    return null;
  }
};

// Broadcast event to all connected clients
const broadcastEvent = (event, data) => {
  io.emit(event, data);
};

// Emit event to specific user
const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// Emit event to a room
const emitToRoom = (roomId, event, data) => {
  io.to(roomId).emit(event, data);
};

module.exports = {
  initializeSocket,
  sendNotification,
  broadcastEvent,
  emitToUser,
  emitToRoom
};