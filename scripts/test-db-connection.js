const { query, pool } = require('./db-client');

async function testConnection() {
    console.log("--- TESTING POSTGRESQL CONNECTION ---");
    console.log(`Connection String: ${process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND'}`);

    const start = Date.now();
    try {
        const { rows } = await query('SELECT NOW() as current_time, version()');
        const duration = Date.now() - start;

        console.log("RESULT: PASS");
        console.log("Database Time:", rows[0].current_time);
        console.log("Database Version:", rows[0].version);
        console.log(`Latency: ${duration}ms`);

        // Test a table
        const { rows: tableRows } = await query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(`Total tables in 'public' schema: ${tableRows[0].count}`);

    } catch (error) {
        console.log("RESULT: FAIL");
        console.log("Error Message:", error.message);
        console.log("Error Code:", error.code);
        if (error.stack) {
            console.log("Stack Trace:", error.stack);
        }
    } finally {
        await pool.end();
        console.log("Connection pool closed.");
    }
}

testConnection();
