const db = require('./db');

async function test() {
    try {
        const userId = 'ef162798-277b-4768-923a-87a96c001dd1'; // Ansh Sen
        
        const [profiles] = await db.execute('SELECT branch, semester, programme FROM profiles WHERE id = ?', [userId]);
        const { branch, semester, programme } = profiles[0];
        console.log('User Profile:', { branch, semester, programme });

        let personalQuery = `
            SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.rating_avg as seller_rating, p.major as seller_major
            FROM listings l
            JOIN profiles p ON l.seller_id = p.id
            LEFT JOIN purchases pur ON l.id = pur.listing_id AND pur.buyer_id = ?
            WHERE l.status = 'available' 
              AND l.is_draft = FALSE 
              AND l.seller_id != ?
              AND pur.id IS NULL
        `;
        
        const params = [userId, userId];
        
        if (branch && semester && programme) {
            personalQuery += ` AND l.branch = ? AND l.semester = ? AND l.programme = ?`;
            params.push(branch, semester, programme);
        } else {
            personalQuery += ` AND 1=0 `; 
        }

        personalQuery += ` ORDER BY l.ai_score DESC, l.view_count DESC, l.created_at DESC LIMIT 10`;

        console.log('Executing Query...');
        let [personalizedListings] = await db.execute(personalQuery, params);
        console.log('Personalized results:', personalizedListings.length);

        if (personalizedListings.length < 5) {
            console.log('Attempting Backfill...');
            const excludeIds = personalizedListings.map(l => l.id);
            let backfillQuery = `
                SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.rating_avg as seller_rating, p.major as seller_major
                FROM listings l
                JOIN profiles p ON l.seller_id = p.id
                LEFT JOIN purchases pur ON l.id = pur.listing_id AND pur.buyer_id = ?
                WHERE l.status = 'available' 
                  AND l.is_draft = FALSE 
                  AND l.seller_id != ?
                  AND pur.id IS NULL
            `;
            const backfillParams = [userId, userId];

            if (excludeIds.length > 0) {
                backfillQuery += ` AND l.id NOT IN (${excludeIds.map(() => '?').join(',')})`;
                backfillParams.push(...excludeIds);
            }

            const limitCount = 10 - personalizedListings.length;
            backfillQuery += ` ORDER BY l.created_at DESC LIMIT ${limitCount}`;

            const [backfill] = await db.execute(backfillQuery, backfillParams);
            console.log('Backfill results:', backfill.length);
        }

    } catch (err) {
        console.error('QUERY FAILED:', err);
    } finally {
        process.exit();
    }
}

test();
