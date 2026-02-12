const { query } = require('./db-client');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    console.log("Checking for admin user...");

    try {
        const { rows } = await query(
            'SELECT * FROM public.users WHERE email = $1',
            ['admin@pharmacy.com']
        );

        const user = rows[0];

        if (!user) {
            console.log("Admin user 'admin@pharmacy.com' NOT found.");
            const { rows: countRows } = await query('SELECT COUNT(*) FROM public.users');
            console.log(`Total users in DB: ${countRows[0].count}`);
        } else {
            console.log("Admin user found.");
            const valid = await bcrypt.compare('admin123', user.password);
            console.log(`Password 'admin123' is ${valid ? 'CORRECT' : 'INCORRECT'}`);
            console.log("User details:", {
                userId: user.userId,
                role: user.role,
                verificationStatus: user.verificationStatus,
                active: user.active
            });
        }
    } catch (error) {
        console.error("Error checking admin:", error.message);
    } finally {
        process.exit();
    }
}

checkAdmin();
