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
        // 1. Check workspaces
        const ws = await pool.query("SELECT * FROM workspaces WHERE id = 'ws-default'");
        if (ws.rows.length === 0) {
            await pool.query(`INSERT INTO workspaces (id, user_id, name, colour, icon, updated_at) VALUES ('ws-default', 'user-1', 'Default Workspace', 'text-accent-1', 'Briefcase', NOW())`);
            console.log('✅ ws-default inserted');
        }

        // 2. Check for 'default' board
        const b1 = await pool.query("SELECT * FROM boards WHERE id = 'default'");
        if (b1.rows.length === 0) {
            await pool.query(`INSERT INTO boards (id, workspace_id, user_id, name, updated_at) VALUES ('default', 'ws-default', 'user-1', 'Legacy Board', NOW())`);
            console.log('✅ board "default" inserted');
        }

        // 3. Check for 'board-default'
        const b2 = await pool.query("SELECT * FROM boards WHERE id = 'board-default'");
        if (b2.rows.length === 0) {
            await pool.query(`INSERT INTO boards (id, workspace_id, user_id, name, updated_at) VALUES ('board-default', 'ws-default', 'user-1', 'Main Board', NOW())`);
            console.log('✅ board "board-default" inserted');
        }

        console.log('📊 Current Boards in DB:', (await pool.query("SELECT id FROM boards")).rows);

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
