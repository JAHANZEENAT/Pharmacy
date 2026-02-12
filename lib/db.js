import { Pool } from 'pg';

const rawConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:DDFpharmacy2@2026@db.vjcaoallghnvqwnrwwtg.supabase.co:5432/postgres';

// Fix for passwords containing special characters like '@'
const connectionString = rawConnectionString.replace(
    /(postgresql:\/\/.*:)(.*)(@.*)/,
    (match, prefix, password, suffix) => {
        if (password.includes('@') && !password.includes('%40')) {
            return `${prefix}${encodeURIComponent(password)}${suffix}`;
        }
        return match;
    }
);

console.log('[DB] Initializing connection to:', connectionString.split('@')[1] || 'localhost');

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout for Supabase
});

// Helper for raw queries
export const query = async (text, params) => {
    const start = Date.now();
    const queryId = Math.random().toString(36).substring(7);
    console.log(`[DB] [${queryId}] Executing: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`[DB] [${queryId}] Success - Duration: ${duration}ms, Rows: ${res.rowCount}`);
        return res;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`[DB] [${queryId}] Error after ${duration}ms:`, error.message);
        throw error;
    }
};

// Helper for transactions
export const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = () => {
        client.release();
    };
    return { client, query, release };
};

export { pool };
