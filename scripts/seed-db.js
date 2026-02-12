const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const connectionString = 'postgresql://postgres:ddf123@localhost:5432/Pharmacy';

async function seed() {
    console.log('Seeding local DB...');
    const pool = new Pool({ connectionString });
    try {
        const password = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        // Create Admin
        await pool.query(`
      INSERT INTO users ("userId", email, password, name, role, active, "verificationStatus", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin', active = true
    `, [uuidv4(), 'admin@pharmacy.com', adminPassword, 'System Admin', 'admin', true, 'approved', new Date().toISOString()]);

        // Create Pharmacist
        const pharmId = uuidv4();
        await pool.query(`
      INSERT INTO users ("userId", email, password, name, role, active, "verificationStatus", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'pharmacist', active = true
    `, [pharmId, 'pharmacist@test.com', password, 'Test Pharmacist', 'pharmacist', true, 'approved', new Date().toISOString()]);

        // Ensure Pharmacy entry exists
        const pharmCheck = await pool.query('SELECT * FROM pharmacies WHERE user_id IN (SELECT "userId" FROM users WHERE email = $1)', ['pharmacist@test.com']);
        if (pharmCheck.rows.length === 0) {
            await pool.query(`
        INSERT INTO pharmacies (user_id, pharmacy_name, owner_name, city, state, pincode, license_number)
        SELECT "userId", 'Test Pharmacy', 'Test Owner', 'Kolkata', 'West Bengal', '700001', 'DL-12345'
        FROM users WHERE email = 'pharmacist@test.com'
      `);
        }

        console.log('Seeding COMPLETE!');
    } catch (err) {
        console.error('Seeding FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
