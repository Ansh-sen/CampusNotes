const db = require('./db');

async function check() {
    try {
        const [profiles] = await db.execute('SELECT * FROM profiles WHERE full_name LIKE "Ansh%" LIMIT 1');
        const user = profiles[0];
        console.log('User ID:', user.id);

        const [listings] = await db.execute(
            'SELECT id, title, seller_id, branch, semester, programme FROM listings WHERE branch = ? AND semester = ?',
            [user.branch, user.semester]
        );
        console.log('\nMatching listings:', listings.map(l => ({
            title: l.title,
            is_his_own: l.seller_id === user.id,
            programme: l.programme
        })));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
