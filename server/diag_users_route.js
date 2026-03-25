const db = require('./db');
async function test() {
    try {
        const req = { query: { page: 1, status: 'all', search: '', limit: 20 } };
        const { page = 1, status = 'all', search = '', limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status === 'verified') whereClause += ' AND verification_status = "verified"';
        else if (status === 'pending') whereClause += ' AND verification_status = "pending"';
        else if (status === 'blocked') whereClause += ' AND is_blocked = true';
        
        console.log('Query:', `SELECT id, full_name as name, email FROM profiles ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
        console.log('Params:', [...params, parseInt(limit), parseInt(offset)]);
        
        const [users] = await db.execute(`SELECT id, full_name as name, email FROM profiles ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
        console.log('Users count:', users.length);
        
        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSTIC ERROR:', err);
        process.exit(1);
    }
}
test();
