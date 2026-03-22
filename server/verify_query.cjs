const db = require('./db');

async function verify() {
    try {
        const userId = 'ef162798-277b-4768-923a-87a96c001dd1'; // Ansh
        const query = `
            SELECT 
                c.id AS conversation_id,
                (SELECT COUNT(*) FROM messages 
                 WHERE conversation_id = c.id 
                 AND sender_id != ? 
                 AND is_read = FALSE 
                 AND is_deleted = FALSE) AS unread_count
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            JOIN profiles p_other ON p_other.id = CASE 
                WHEN c.buyer_id = ? THEN c.seller_id 
                ELSE c.buyer_id 
            END
            LEFT JOIN blocked_users bu1 ON bu1.blocker_id = ? AND bu1.blocked_id = p_other.id
            LEFT JOIN blocked_users bu2 ON bu2.blocker_id = p_other.id AND bu2.blocked_id = ?
            WHERE (c.buyer_id = ? OR c.seller_id = ?)
            AND bu1.blocker_id IS NULL AND bu2.blocker_id IS NULL
            AND c.is_archived = ?
            ORDER BY c.last_message_at DESC
        `;
        
        console.log('Running query with 7 params...');
        const [rows] = await db.execute(query, [userId, userId, userId, userId, userId, userId, 0]);
        console.log('Results:', rows.length);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

verify();
