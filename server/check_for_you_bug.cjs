const db = require('./db');

async function check() {
    try {
        // 1. Find the user 'Ansh' (or current user)
        const [profiles] = await db.execute('SELECT * FROM profiles WHERE full_name LIKE "Ansh%" LIMIT 1');
        if (profiles.length === 0) {
            console.log('No profile found for Ansh');
            return;
        }
        const user = profiles[0];
        console.log('User Profile:', {
            id: user.id,
            full_name: user.full_name,
            branch: user.branch,
            semester: user.semester,
            programme: user.programme
        });

        // 2. Count listings matching this profile
        const [counts] = await db.execute(
            'SELECT COUNT(*) as count FROM listings WHERE branch = ? AND semester = ? AND programme = ? AND status = "available" AND is_draft = FALSE',
            [user.branch, user.semester, user.programme]
        );
        console.log(`\nDirect match listing count: ${counts[0].count}`);

        // 3. Check some listings to see what the branch names look like
        const [listings] = await db.execute('SELECT branch, semester, programme FROM listings LIMIT 5');
        console.log('\nSample Listing Data:', listings);

        // 4. Try fuzzy match for branch
        const [fuzzyCounts] = await db.execute(
            'SELECT COUNT(*) as count FROM listings WHERE branch LIKE ? AND status = "available" AND is_draft = FALSE',
            [`%${user.branch}%`]
        );
        console.log(`\nFuzzy branch match count: ${fuzzyCounts[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
