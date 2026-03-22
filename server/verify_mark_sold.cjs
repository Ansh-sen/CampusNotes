const db = require('./db');

async function verify() {
    try {
        const userId = 'ef162798-277b-4768-923a-87a96c001dd1';
        const convId = 'fba97fcf-1fd8-11f1-afbd-a0ad9fcb29c6';
        
        console.log('Testing mark-sold logic for conv:', convId);
        
        // Simulating the logic:
        const [convs] = await db.execute('SELECT * FROM conversations WHERE id = ?', [convId]);
        if (convs.length === 0) {
            console.log('Conversation not found in DB - skipping test.');
            return;
        }
        
        const conv = convs[0];
        
        // This is the part that failed:
        const systemMsgId = 'test-system-msg-' + Date.now();
        await db.execute(
            `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, message_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [systemMsgId, convId, userId, conv.buyer_id, 'Test system message', 'system']
        );
        
        console.log('Insert successful!');
        
        // Clean up
        await db.execute('DELETE FROM messages WHERE id = ?', [systemMsgId]);
        console.log('Test clean up done.');

    } catch (err) {
        console.error('Verfication failed:', err.message);
    } finally {
        process.exit();
    }
}

verify();
