const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function test() {
    console.log('--- Testing PostgreSQL Connection ---');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`DB:   ${process.env.DB_NAME}`);

    try {
        const res = await pool.query('SELECT current_database(), version()');
        console.log('\n✅ SUCCESS!');
        console.log(`Connected to: ${res.rows[0].current_database}`);
        console.log(`Version: ${res.rows[0].version}`);
        process.exit(0);
    } catch (err) {
        console.error('\n❌ ERROR:');
        console.error(err.message);
        if (err.stack.includes('ENOTFOUND')) {
            console.error('\nHint: The hostname could not be resolved. Double-check DB_HOST.');
        }
        process.exit(1);
    }
}

test();
