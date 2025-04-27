require('dotenv').config();

const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const http = require('http');
const cron = require('./scheduledTasks');

const corsOptions = require('./config/corsOptions');
const { protect } = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { initializeSocket } = require('./services/socketService');

// Import routes
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const friendChatRoutes = require('./routes/friendChatRoutes');
const teamChatRoutes = require('./routes/teamChatRoutes');
const projectChatRoutes = require('./routes/projectChatRoutes');
const noteRoutes = require('./routes/noteRoutes');
const eventRoutes = require('./routes/eventRoutes');
const contactRoutes = require('./routes/contactRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// app.use(cors(corsOptions));
app.use(cors({
    origin: 'https://projo-bice.vercel.app',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Debug logging middleware
app.use((req, res, next) => {
    // console.log('Incoming request:', {
    //     method: req.method,
    //     url: req.url,
    //     body: req.body,
    //     headers: req.headers
    // });
    next();
});

// Mount routes
app.use('/user', userRoutes);
app.use('/team', protect, teamRoutes);
app.use('/project', protect, projectRoutes);
app.use('/task', protect, taskRoutes);
app.use('/friend-chat', protect, friendChatRoutes);
app.use('/team-chat', protect, teamChatRoutes);
app.use('/project-chat', protect, projectChatRoutes);
app.use('/notes', protect, noteRoutes);
app.use('/events', protect, eventRoutes);
app.use('/contacts', protect, contactRoutes);
app.use('/notifications', protect, notificationRoutes);
app.use('/dashboard', protect, dashboardRoutes);

// Use error handler middleware
app.use(errorHandler);

// Handle 404
app.all('*', (req, res) => {
    // console.log('404 Not Found:', {
    //     method: req.method,
    //     url: req.url,
    //     body: req.body,
    //     headers: req.headers
    // });
    res.status(404).json({ message: '404 Not Found' });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Initialize scheduled tasks
console.log('Initializing scheduled tasks...');

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log(err);
});
