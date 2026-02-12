const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Manually parse .env
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const match = trimmedLine.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                process.env[key] = value;
            }
        });
    }
} catch (e) { }

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}

async function migrate() {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const client = new Client({
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    try {
        console.log(`Connecting to database...`);
        await client.connect();
        console.log("Connected successfully.");

        // Read schema file
        const schemaPath = path.resolve(__dirname, '../pg_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Running schema migration...");
        // Split schema by statement if needed, or run as one block
        // Assuming simple schema file
        await client.query(schemaSql);
        console.log("Schema applied successfully.");

        // Create Admin User
        console.log("Checking/Creating admin user...");
        const adminEmail = 'admin@pharmacy.com';
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const res = await client.query('SELECT * FROM public.users WHERE email = $1', [adminEmail]);
        if (res.rows.length === 0) {
            console.log("Creating admin user...");
            await client.query(`
                INSERT INTO public.users (
                    "userId", email, password, name, role, "verificationStatus", active, "createdAt"
                ) VALUES (
                    gen_random_uuid(), $1, $2, 'System Admin', 'admin', 'approved', true, NOW()
                )
            `, [adminEmail, hashedPassword]);
            console.log("Admin user created.");
        } else {
            console.log("Admin user already exists. Updating password...");
            await client.query('UPDATE public.users SET password = $1 WHERE email = $2', [hashedPassword, adminEmail]);
            console.log("Admin password updated.");
        }

    } catch (err) {
        console.error("Migration failed!");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Full error:", JSON.stringify(err, null, 2));
    } finally {
        await client.end();
    }
}

migrate();
