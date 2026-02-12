const { query } = require('./db-client');

async function checkSchema() {
    console.log("Checking schema for 'users' table...");

    try {
        const { rows } = await query('SELECT * FROM public.users LIMIT 1');

        if (rows && rows.length > 0) {
            console.log("COLUMNS_LIST_START");
            Object.keys(rows[0]).forEach(col => console.log(col));
            console.log("COLUMNS_LIST_END");
        } else {
            console.log("No users found to check schema.");
            // Alternative: query information_schema
            const { rows: columns } = await query(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
            );
            console.log("COLUMNS_LIST_START");
            columns.forEach(c => console.log(c.column_name));
            console.log("COLUMNS_LIST_END");
        }
    } catch (error) {
        console.error("Error fetching schema:", error.message);
    } finally {
        process.exit();
    }
}

checkSchema();
