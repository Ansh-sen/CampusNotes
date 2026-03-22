const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// General API Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // set `RateLimit` and `RateLimit-Policy` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { error: 'Too many requests, please try again later.' }
});

// Define HTTP Server for Socket.io
const server = http.createServer(app);

const { router: authRouter, authenticateToken } = require('./routes/auth');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Vite port
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.user = decoded;
        next();
    });
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Required for serving uploaded images to React on a different port
}));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/api/', apiLimiter);

// Request Logging Middleware

// Routes
const listingsRouter = require('./routes/listings');
const messagesRouter = require('./routes/messages'); // NEW
const reviewsRouter = require('./routes/reviews');
const academicRouter = require('./routes/academic'); // RGPV Academic
const requestsRouter = require('./routes/requests'); // NEW
const usersRouter = require('./routes/users'); // NEW

app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api', academicRouter); // /api/programmes, /api/branches, /api/semesters, /api/subjects, /api/categories
app.use('/api/requests', requestsRouter);
app.use('/api/users', usersRouter);

// Socket.io Event Listeners
io.on('connection', (socket) => {
    console.log(`📡 New client connected: ${socket.id} (User: ${socket.user.id})`);

    // Join a specific conversation room
    socket.on('join_room', (conversationId) => {
        // SECURITY: We should ideally verify if socket.user.id is a participant in conversationId
        // For now, at least we know the user is authenticated.
        socket.join(conversationId);
        console.log(`Client ${socket.id} joined room: ${conversationId}`);
    });

    // Join a user-specific room for global notifications
    socket.on('join_user_room', (userId) => {
        // SECURITY: Only allow joining your OWN user room
        const targetUserId = socket.user.id;
        socket.join(`user_${targetUserId}`);
        socket.userId = targetUserId; 
        console.log(`Client ${socket.id} joined global user room: user_${targetUserId}`);
        
        // Broadcast that this user is online
        io.emit('user_online', { userId: targetUserId });
    });

    // Handle sending message inside room
    socket.on('send_message', (data) => {
        // SECURITY: Use authenticated user ID as sender
        data.sender_id = socket.user.id;
        
        // Broadcast to everyone else in the conversation room
        socket.to(data.conversation_id).emit('receive_message', data);
        
        // Notify recipient globally to update unread badge
        if (data.recipient_id) {
            socket.to(`user_${data.recipient_id}`).emit('unread_update', { 
                conversation_id: data.conversation_id,
                increment: true 
            });
        }
    });

    // Notify read status globally
    socket.on('mark_read', (data) => {
        // data: { conversation_id, reader_id, other_id }
        socket.to(`user_${data.other_id}`).emit('unread_update', {
            conversation_id: data.conversation_id,
            increment: false
        });
    });

    // Handle editing message inside room
    socket.on('edit_message', (data) => {
        // Broadcast edited message to everyone else in the room
        socket.to(data.conversation_id).emit('message_edited', data);
    });

    // Handle deleting message inside room
    socket.on('delete_message', (data) => {
        // Broadcast deleted message to everyone else in the room
        socket.to(data.conversation_id).emit('message_deleted', data);
    });

    // Handle typing status inside room
    socket.on('typing_status', (data) => {
        // data: { conversation_id, user_id, isTyping }
        socket.to(data.conversation_id).emit('typing_status', data);
    });

    socket.on('typing_start', (data) => {
        // data: { conversationId, userId }
        socket.to(data.conversationId).emit('typing_start', data);
    });

    socket.on('typing_stop', (data) => {
        // data: { conversationId, userId }
        socket.to(data.conversationId).emit('typing_stop', data);
    });

    socket.on('messages_read', (data) => {
       // data: { conversation_id, reader_id, sender_id }
       socket.to(`user_${data.sender_id}`).emit('messages_read', data);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        if (socket.userId) {
            io.emit('user_offline', { userId: socket.userId });
        }
    });
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CampusNotes Express API + WebSockets running!' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[FATAL ERROR] ${req.method} ${req.url}:`, err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start Server on the combined HTTP + Socket Server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
