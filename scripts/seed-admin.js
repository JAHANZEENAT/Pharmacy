const { query } = require('./db-client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedAdmin() {
    console.log("Seeding admin account...");
    const adminEmail = 'admin@pharmacy.com';
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userId = uuidv4();

    try {
        const sql = `
            INSERT INTO public.users (
                "userId", email, password, name, role, active, "verificationStatus", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                active = EXCLUDED.active,
                "verificationStatus" = EXCLUDED."verificationStatus"
        `;

        await query(sql, [
            userId,
            adminEmail,
            adminPassword,
            'System Admin',
            'admin',
            true,
            'approved',
            new Date().toISOString()
        ]);

        console.log("Admin account 'admin@pharmacy.com' seeded successfully!");
        console.log("Password set to: admin123");
    } catch (error) {
        console.error("Seeding failed:", error.message);
    } finally {
        process.exit();
    }
}

seedAdmin();
