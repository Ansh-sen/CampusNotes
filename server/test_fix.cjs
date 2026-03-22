const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function test() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        console.log('--- Testing Message Insertion ---');
        
        // 1. Get a valid conversation ID
        const [convs] = await db.execute('SELECT id, buyer_id, seller_id FROM conversations LIMIT 1');
        if (convs.length === 0) {
            console.log('No conversations found to test with.');
            return;
        }
        const conv = convs[0];
        const conversation_id = conv.id;
        const sender_id = conv.buyer_id;
        const recipient_id = conv.seller_id;
        const testContent = "Test Message " + Date.now();

        console.log(`Using conversation: ${conversation_id}`);
        
        // 2. Perform the logic from messages.js
        const messageId = uuidv4();
        console.log(`Generated messageId: ${messageId}`);

        await db.execute(
            `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, message_type, delivered_at) 
             VALUES (?, ?, ?, ?, ?, 'text', NOW())`,
            [messageId, conversation_id, sender_id, recipient_id, testContent]
        );
        console.log('Message inserted.');

        // 3. Fetch it back
        const [newMessage] = await db.execute(`SELECT * FROM messages WHERE id = ?`, [messageId]);
        
        if (newMessage.length === 0) {
            console.error('FAILED: Message not found after insertion!');
        } else {
            console.log('SUCCESS: Message retrieved:', newMessage[0].content);
            if (newMessage[0].content === testContent) {
                console.log('CONFIRMED: Content matches.');
            } else {
                console.error('FAILED: Content mismatch! Expected:', testContent, 'Got:', newMessage[0].content);
            }
            if (newMessage[0].id === messageId) {
                console.log('CONFIRMED: ID matches.');
            } else {
                console.error('FAILED: ID mismatch!');
            }
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await db.end();
    }
}

test();
