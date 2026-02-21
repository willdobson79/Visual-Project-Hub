const { Pool } = require('pg');

const pool = new Pool({
    host: 'willpowered.design',
    port: 5432,
    database: 'dbyqepnzhm8tvl',
    user: 'ueohxsyzg8cri',
    password: '5g92wpcjj6as',
    ssl: false
});

async function run() {
    try {
        const res = await pool.query("SELECT * FROM boards WHERE id = 'default'");
        console.log('Board "default":', JSON.stringify(res.rows[0], null, 2));

        const checkConstraints = await pool.query(`
        SELECT
            conname AS constraint_name,
            conrelid::regclass AS table_name,
            confrelid::regclass AS referenced_table_name
        FROM
            pg_constraint
        WHERE
            conname = 'cards_board_id_fkey';
    `);
        console.log('Constraints:', checkConstraints.rows);
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
