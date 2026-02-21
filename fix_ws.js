const { Pool } = require('pg');
const dotenv = require('dotenv');
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
      INSERT INTO workspaces (id, user_id, name, colour, icon, sort_order, updated_at)
      VALUES ('ws-default', 'user-1', 'My Workspace', 'text-accent-3', 'Briefcase', 0, NOW())
      ON CONFLICT (id) DO NOTHING
    `);
        console.log('✅ Workspace check result:', res.rowCount);

        // Check if it exists now
        const check = await pool.query("SELECT * FROM workspaces WHERE id = 'ws-default'");
        console.log('🔍 Workspace in DB:', check.rows);
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
