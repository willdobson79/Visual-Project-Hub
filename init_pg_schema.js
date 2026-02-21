const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

async function initSchema() {
  console.log('🚀 Initialising PostgreSQL Schema for PKM Super Hub...');

  const client = await pool.connect();
  try {
    // Enable UUID extension (if possible, otherwise use serials/strings)
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (e) {
      console.log('Note: uuid-ossp extension could not be enabled, using standard text IDs.');
    }

    await client.query('BEGIN');

    // 1. Tabs (top-level categories)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tabs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('  ✓ tabs');

    // 2. Workspaces
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        tab_id TEXT REFERENCES tabs(id) ON DELETE SET NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        colour TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    // Add tab_id column if it doesn't exist (for upgrades)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'tab_id') THEN
          ALTER TABLE workspaces ADD COLUMN tab_id TEXT REFERENCES tabs(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('  ✓ workspaces');

    // 3. Boards
    await client.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        settings JSONB,
        is_locked BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('  ✓ boards');

    // 4. Cards
    await client.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        position_x FLOAT NOT NULL,
        position_y FLOAT NOT NULL,
        width FLOAT,
        height FLOAT,
        colour TEXT,
        title TEXT,
        description TEXT,
        status TEXT,
        priority TEXT,
        content TEXT,
        z_index INTEGER DEFAULT 0,
        locked BOOLEAN DEFAULT FALSE,
        tags TEXT[],
        project_ref TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    // Add project_ref column if it doesn't exist (for upgrades)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'project_ref') THEN
          ALTER TABLE cards ADD COLUMN project_ref TEXT;
        END IF;
      END $$;
    `);
    console.log('  ✓ cards');

    // 5. Connections
    await client.query(`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        from_card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        to_card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        type TEXT,
        style TEXT,
        colour TEXT,
        label TEXT,
        animated BOOLEAN DEFAULT FALSE,
        stroke_width INTEGER DEFAULT 2,
        marker_start TEXT DEFAULT 'none',
        marker_end TEXT DEFAULT 'arrow',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    // Add marker columns if they don't exist (for upgrades)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connections' AND column_name = 'marker_start') THEN
          ALTER TABLE connections ADD COLUMN marker_start TEXT DEFAULT 'none';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connections' AND column_name = 'marker_end') THEN
          ALTER TABLE connections ADD COLUMN marker_end TEXT DEFAULT 'arrow';
        END IF;
      END $$;
    `);
    console.log('  ✓ connections');

    // 6. Tag Rules (auto-add tags per board)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tag_rules (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ tag_rules');

    // 7. Sync metadata (for tracking last pull timestamp per device)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        device_id TEXT PRIMARY KEY,
        last_pulled_at TIMESTAMP WITH TIME ZONE DEFAULT '1970-01-01T00:00:00Z'
      )
    `);
    console.log('  ✓ sync_metadata');

    await client.query('COMMIT');
    console.log('\n✅ PostgreSQL Schema initialised successfully!');
    console.log('   Hierarchy: Tabs → Workspaces → Boards → Cards → Connections');
    console.log('   Extras: tag_rules, sync_metadata');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Schema initialisation failed:');
    console.error(err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

initSchema();
