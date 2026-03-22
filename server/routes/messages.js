const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Sanitize original filename and ensure extension is valid
        const cleanName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname).toLowerCase();
        cb(null, cleanName)
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Allowed: Images, PDF, DOCX.'));
        }
    }
});

// GET /api/messages/unread-count - Fetch total unread messages for a user
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await db.execute(
            'SELECT COUNT(*) as unreadCount FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE (c.buyer_id = ? OR c.seller_id = ?) AND m.sender_id != ? AND m.is_read = FALSE AND m.is_deleted = FALSE',
            [userId, userId, userId]
        );
        res.json({ unreadCount: result[0].unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count.' });
    }
});


// POST /api/messages/heartbeat - Update user online status
router.post('/heartbeat', authenticateToken, async (req, res) => {
    try {
        await db.execute('UPDATE profiles SET last_seen_at = NOW() WHERE id = ?', [req.user.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Heartbeat failed' });
    }
});

// GET /api/messages/conversations - Fetch inbox for a user (Enhanced)
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                c.id AS conversation_id,
                l.id AS listing_id,
                l.title AS listing_title,
                l.subject_code AS listing_subject_code,
                l.seller_id AS listing_seller_id,
                p_other.id AS other_id,
                p_other.full_name AS other_name,
                p_other.avatar_url AS other_avatar,
                p_other.last_seen_at AS other_last_seen_at,
                m_last.content AS last_message_content,
                m_last.created_at AS last_message_at,
                (SELECT COUNT(*) FROM messages 
                 WHERE conversation_id = c.id 
                 AND sender_id != ? 
                 AND is_read = FALSE 
                 AND is_deleted = FALSE) AS unread_count
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            /* Join profiles logic: if I am the buyer, join seller. If I am the seller, join buyer. */
            JOIN profiles p_other ON p_other.id = CASE 
                WHEN c.buyer_id = ? THEN c.seller_id 
                ELSE c.buyer_id 
            END
            /* Exclude blocked users */
            LEFT JOIN blocked_users bu1 ON bu1.blocker_id = ? AND bu1.blocked_id = p_other.id
            LEFT JOIN blocked_users bu2 ON bu2.blocker_id = p_other.id AND bu2.blocked_id = ?
            /* Get the very last message */
            LEFT JOIN messages m_last ON m_last.id = (
                SELECT id FROM messages 
                WHERE conversation_id = c.id 
                AND is_deleted = FALSE
                ORDER BY created_at DESC 
                LIMIT 1
            )
            WHERE (c.buyer_id = ? OR c.seller_id = ?)
            AND bu1.blocker_id IS NULL AND bu2.blocker_id IS NULL
            AND c.is_archived = ?
            ORDER BY c.last_message_at DESC
        `;
        
        const isArchived = req.query.archived === 'true';
        const [rows] = await db.execute(query, [userId, userId, userId, userId, userId, userId, isArchived ? 1 : 0]);
        
        const data = rows.map(row => ({
            id: row.conversation_id,
            other_participant: {
                id: row.other_id,
                name: row.other_name,
                avatar: row.other_avatar,
                last_seen_at: row.other_last_seen_at
            },
            listing: {
                id: row.listing_id,
                title: row.listing_title,
                subject_code: row.listing_subject_code,
                seller_id: row.listing_seller_id
            },
            last_message: {
                content: row.last_message_content,
                created_at: row.last_message_at
            },
            is_unread: row.unread_count > 0,
            unread_count: row.unread_count
        }));
        
        res.json({ data });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
});

// GET /api/messages/conversations/:id/safety-checkin - Check for past-due meetups
router.get('/conversations/:id/safety-checkin', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const convId = req.params.id;

        // 1. Get listing_id for this conversation
        const [convs] = await db.execute('SELECT listing_id FROM conversations WHERE id = ?', [convId]);
        if (convs.length === 0) return res.json({ data: null });
        const listingId = convs[0].listing_id;

        // 2. Find most recent 'scheduled' meetup in the past (> 1 hour ago)
        const query = `
            SELECT * FROM scheduled_meetups 
            WHERE listing_id = ? 
            AND (buyer_id = ? OR seller_id = ?)
            AND status = 'scheduled'
            AND CONCAT(meetup_date, ' ', meetup_time) < (NOW() - INTERVAL 1 HOUR)
            ORDER BY meetup_date DESC, meetup_time DESC
            LIMIT 1
        `;
        const [meetups] = await db.execute(query, [listingId, userId, userId]);
        
        if (meetups.length === 0) return res.json({ data: null });
        
        res.json({ data: meetups[0] });
    } catch (error) {
        console.error('Error fetching safety checkin:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/messages/conversations/:id - Fetch a single conversation (Detailed)
router.get('/conversations/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const convId = req.params.id;
        
        const query = `
            SELECT 
                c.*, 
                l.title AS listing_title, 
                l.price AS listing_price, 
                l.status AS listing_status,
                l.subject_code AS listing_subject_code,
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY order_index ASC LIMIT 1) AS listing_image,
                p_other.id AS other_id, 
                p_other.full_name AS other_name, 
                p_other.avatar_url AS other_avatar,
                p_other.last_seen_at AS other_last_seen_at,
                p_other.is_topper AS other_is_topper,
                p_other.rating_avg AS other_rating,
                (SELECT COUNT(*) FROM listings WHERE seller_id = p_other.id AND status = 'sold') AS other_sales
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            JOIN profiles p_other ON p_other.id = CASE 
                WHEN c.buyer_id = ? THEN c.seller_id 
                ELSE c.buyer_id 
            END
            WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)
        `;
        
        const [rows] = await db.execute(query, [userId, convId, userId, userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
        
        res.json({ data: rows[0] });
    } catch (error) {
        console.error('Error fetching conversation detail:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// PATCH /api/messages/mark-read - Bulk mark messages as read
router.patch('/mark-read', authenticateToken, async (req, res) => {
    try {
        const { conversation_id, sender_id } = req.body;
        const userId = req.user.id;
        
        await db.execute(`
            UPDATE messages 
            SET read_at = NOW(), is_read = TRUE 
            WHERE conversation_id = ? AND recipient_id = ? AND read_at IS NULL
        `, [conversation_id, userId]);
        
        // Emit socket event to the sender so their ticks turn blue
        const io = req.app.get('io');
        if (io && sender_id) {
            io.to(`user_${sender_id}`).emit('messages_read', { 
                conversation_id, 
                reader_id: userId 
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// PATCH /api/messages/:id/meetup - Accept or Decline a meetup proposal
router.patch('/:id/meetup', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'declined'
        const messageId = req.params.id;
        const userId = req.user.id;

        // Verify the message exists and user is recipient
        const [msgs] = await db.execute('SELECT * FROM messages WHERE id = ? AND recipient_id = ?', [messageId, userId]);
        if (msgs.length === 0) return res.status(403).json({ error: 'Proposal not found' });

        const message = msgs[0];
        const content = JSON.parse(message.content);
        content.status = status;

        await db.execute('UPDATE messages SET content = ? WHERE id = ?', [JSON.stringify(content), messageId]);

        if (status === 'accepted') {
            const [convs] = await db.execute('SELECT * FROM conversations WHERE id = ?', [message.conversation_id]);
            const conv = convs[0];
            await db.execute(`
                INSERT INTO scheduled_meetups (listing_id, buyer_id, seller_id, meetup_date, meetup_time, location, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [conv.listing_id, conv.buyer_id, conv.seller_id, content.date, content.time, content.location, content.amount]);
        }

        res.json({ success: true, status });
    } catch (error) {
        console.error('Error updating meetup status:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/messages/:id/report - Report a specific message
router.post('/:id/report', authenticateToken, async (req, res) => {
    try {
        const messageId = req.params.id;
        const reporterId = req.user.id;
        const { reason } = req.body;

        await db.execute(
            'INSERT INTO reports (reporter_id, target_id, target_type, reason) VALUES (?, ?, ?, ?)',
            [reporterId, messageId, 'message', reason]
        );

        res.json({ success: true, message: 'Message reported successfully.' });
    } catch (error) {
        console.error('Error reporting message:', error);
        res.status(500).json({ error: 'Failed to report message.' });
    }
});

// GET /api/messages/:conversationId - Fetch messages for a specific chat (Protected)
router.get('/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // VERIFY PARTICIPATION (Security Check)
        const [convs] = await db.execute(
            'SELECT id FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
            [conversationId, userId, userId]
        );

        if (convs.length === 0) {
            return res.status(403).json({ error: 'Access denied. You are not a participant in this conversation.' });
        }
        
        const query = `
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
        `;
        
        const [messages] = await db.execute(query, [conversationId]);
        res.json({ data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// POST /api/messages/upload - Upload a file (Protected with limits)
router.post('/upload', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size too large. Max: 5MB.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            url: fileUrl, 
            name: req.file.originalname, 
            type: req.file.mimetype 
        });
    });
});

// POST /api/messages - Save a new chat message to DB (REST side)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { conversation_id, content, file_url, file_name, file_type, message_type } = req.body;
        const sender_id = req.user.id;

        if (!conversation_id) {
            return res.status(400).json({ error: 'Conversation ID is required.' });
        }

        if (!content && !file_url) {
            return res.status(400).json({ error: 'Content or file is required.' });
        }

        // Determine message type if not provided
        let type = message_type || 'text';
        if (file_type?.startsWith('image/')) type = 'image';
        else if (file_url) type = 'file';

        // Get recipient_id from the conversation
        const [conversationRows] = await db.execute('SELECT buyer_id, seller_id FROM conversations WHERE id = ?', [conversation_id]);
        if (conversationRows.length === 0) {
            return res.status(404).json({ error: 'Conversation not found.' });
        }
        const conversation = conversationRows[0];
        const recipient_id = conversation.buyer_id === sender_id ? conversation.seller_id : conversation.buyer_id;

        // 1. Insert message with message_type and delivered_at
        const messageId = uuidv4();
        await db.execute(
            `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, file_url, file_name, file_type, message_type, delivered_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [messageId, conversation_id, sender_id, recipient_id, content || '', file_url || null, file_name || null, file_type || null, type]
        );
        
        // 2. Update conversation's last_message_at timestamp and sender's last_seen_at
        await Promise.all([
            db.execute(`UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [conversation_id]),
            db.execute(`UPDATE profiles SET last_seen_at = NOW() WHERE id = ?`, [sender_id])
        ]);

        const [newMessage] = await db.execute(`SELECT * FROM messages WHERE id = ?`, [messageId]);

        res.status(201).json({ message: 'Message saved successfully.', data: newMessage[0] });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to save message.' });
    }
});

// PUT /api/messages/:id - Edit a message
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const sender_id = req.user.id;

        // Verify ownership
        const [messages] = await db.execute('SELECT * FROM messages WHERE id = ? AND sender_id = ?', [id, sender_id]);
        if (messages.length === 0) {
            return res.status(403).json({ error: 'Permission denied or message not found.' });
        }

        await db.execute(
            'UPDATE messages SET content = ?, is_edited = TRUE, updated_at = NOW() WHERE id = ?',
            [content, id]
        );

        res.json({ message: 'Message updated successfully.' });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message.' });
    }
});

// PATCH /api/messages/read - Mark messages as read
router.patch('/read/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
            [conversationId, userId]
        );

        res.json({ message: 'Messages marked as read.' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// DELETE /api/messages/:id - Soft delete a message
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sender_id = req.user.id;

        // Verify ownership
        const [messages] = await db.execute('SELECT * FROM messages WHERE id = ? AND sender_id = ?', [id, sender_id]);
        if (messages.length === 0) {
            return res.status(403).json({ error: 'Permission denied or message not found.' });
        }

        // Use soft delete
        await db.execute('UPDATE messages SET is_deleted = TRUE WHERE id = ?', [id]);

        res.json({ message: 'Message deleted successfully.' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message.' });
    }
});

// PATCH /api/messages/mute/:conversationId - Toggle mute status
router.patch('/mute/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const [conversations] = await db.execute('SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', [conversationId, userId, userId]);
        if (conversations.length === 0) {
            return res.status(403).json({ error: 'Permission denied or conversation not found.' });
        }

        const newMuteStatus = !conversations[0].is_muted;
        await db.execute('UPDATE conversations SET is_muted = ? WHERE id = ?', [newMuteStatus, conversationId]);

        res.json({ message: 'Conversation mute status updated.', is_muted: newMuteStatus });
    } catch (error) {
        console.error('Error toggling mute status:', error);
        res.status(500).json({ error: 'Failed to update mute status.' });
    }
});

// DELETE /api/messages/clear/:conversationId - Clear all messages in a conversation
router.delete('/clear/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const [conversations] = await db.execute('SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', [conversationId, userId, userId]);
        if (conversations.length === 0) {
            return res.status(403).json({ error: 'Permission denied or conversation not found.' });
        }

        // Soft delete all messages in the conversation for this user
        // Note: Real implementation might need per-user deletion, but here we just mark as deleted globally for simplicity as per requirement
        await db.execute('UPDATE messages SET is_deleted = TRUE WHERE conversation_id = ?', [conversationId]);

        res.json({ message: 'Chat cleared successfully.' });
    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).json({ error: 'Failed to clear chat.' });
    }
});

// POST /api/messages/conversations - Create a new conversation channel
router.post('/conversations', authenticateToken, async (req, res) => {
    try {
        const { listing_id, seller_id } = req.body;
        const buyer_id = req.user.id;

        // Check if conversation already exists between that buyer and seller for that listing
        const [existing] = await db.execute(
            `SELECT * FROM conversations WHERE listing_id = ? AND buyer_id = ?`,
            [listing_id, buyer_id]
        );

        if (existing.length > 0) {
            return res.json({ data: existing[0] });
        }

        // Insert new discussion
        await db.execute(
            `INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)`,
            [listing_id, buyer_id, seller_id]
        );

        // Fetch it back to get the generated UUID
        const [newConv] = await db.execute(
            `SELECT * FROM conversations WHERE listing_id = ? AND buyer_id = ?`,
            [listing_id, buyer_id]
        );

        res.status(201).json({ data: newConv[0] });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation.' });
    }
});

// DELETE /api/messages/conversations/:id - Delete a conversation
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership (buyer or seller)
        const [conversations] = await db.execute('SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', [id, userId, userId]);
        if (conversations.length === 0) {
            return res.status(403).json({ error: 'Permission denied or conversation not found.' });
        }

        // Delete all messages in the conversation first
        await db.execute('DELETE FROM messages WHERE conversation_id = ?', [id]);
        
        // Delete the conversation
        await db.execute('DELETE FROM conversations WHERE id = ?', [id]);

        res.json({ message: 'Conversation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation.' });
    }
});

// PATCH /api/messages/conversations/:id/archive - Toggle archive status
router.patch('/conversations/:id/archive', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [convs] = await db.execute('SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)', [id, userId, userId]);
        if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });

        const newArchiveStatus = !convs[0].is_archived;
        await db.execute('UPDATE conversations SET is_archived = ? WHERE id = ?', [newArchiveStatus, id]);

        res.json({ success: true, is_archived: newArchiveStatus });
    } catch (error) {
        console.error('Error archiving conversation:', error);
        res.status(500).json({ error: 'Failed to archive' });
    }
});

// POST /api/messages/conversations/:id/mark-sold - Mark listing as sold
router.post('/conversations/:id/mark-sold', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Get conversation details (must be a participant)
        const [convs] = await db.execute('SELECT * FROM conversations WHERE id = ? AND (seller_id = ? OR buyer_id = ?)', [id, userId, userId]);
        if (convs.length === 0) return res.status(403).json({ error: 'You are not a participant in this conversation.' });

        const conv = convs[0];
        const isSeller = conv.seller_id === userId;

        // 2. Update listing status and buyer_id
        await db.execute('UPDATE listings SET status = "sold", buyer_id = ? WHERE id = ?', [conv.buyer_id, conv.listing_id]);

        // 3. Archive this conversation
        await db.execute('UPDATE conversations SET is_archived = TRUE WHERE id = ?', [id]);

        // 4. Send a system message to the chat
        const systemMsgId = uuidv4();
        const content = isSeller 
            ? 'Note: The seller has marked this item as sold.' 
            : 'Note: The buyer has marked this item as purchased.';
            
        await db.execute(
            `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, message_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [systemMsgId, id, userId, isSeller ? conv.buyer_id : conv.seller_id, content, 'system']
        );

        res.json({ success: true, message: isSeller ? 'Listing marked as sold.' : 'Listing marked as purchased.' });
    } catch (error) {
        console.error('Error marking as sold:', error);
        res.status(500).json({ error: 'Failed to update transaction status' });
    }
});

module.exports = router;
