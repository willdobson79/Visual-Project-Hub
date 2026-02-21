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
        const res = await pool.query(`
      INSERT INTO cards (id, board_id, position_x, position_y, title, updated_at) 
      VALUES ('test-card-x', 'default', 0, 0, 'Test', NOW())
    `);
        console.log('✅ Manual insert success:', res.rowCount);
    } catch (e) {
        console.error('❌ Manual insert failed:', e.message);
    } finally {
        await pool.end();
    }
}

run();
