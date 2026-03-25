const db = require('./db');
async function test() {
    try {
        const req = { query: { status: 'all', search: '', page: 1, limit: 20 } };
        const { status = 'all', search = '', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status !== 'all') { whereClause += ' AND approval_status = ?'; params.push(status); }
        if (search) { whereClause += ' AND (title LIKE ? OR subject LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        
        console.log('Query:', `SELECT l.*, p.full_name as seller_name FROM listings l LEFT JOIN profiles p ON l.seller_id = p.id ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`);
        console.log('Params:', [...params, parseInt(limit), parseInt(offset)]);
        
        const [listings] = await db.execute(`SELECT l.*, p.full_name as seller_name FROM listings l LEFT JOIN profiles p ON l.seller_id = p.id ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
        console.log('Listings count:', listings.length);
        
        const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM listings ${whereClause}`, params);
        console.log('Total:', total);

        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSTIC ERROR:', err);
        process.exit(1);
    }
}
test();
