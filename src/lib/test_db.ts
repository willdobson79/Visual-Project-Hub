import { pgQuery } from '@/lib/pg_db';

export async function testPostgresConnection() {
    try {
        // 1. Try a simple version check
        const startTime = Date.now();
        const result = await pgQuery('SELECT version()');
        const duration = Date.now() - startTime;

        console.log('✅ PostgreSQL Connection Successful!');
        console.log('Server version:', result.rows[0].version);
        console.log('Response time:', duration, 'ms');

        // 2. Create foundational tables if they don't exist
        console.log('🛠️ Initialising schema...');

        await pgQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await pgQuery(`
      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        settings JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✨ Schema ready.');
        return { success: true, version: result.rows[0].version };
    } catch (err: any) {
        console.error('❌ PostgreSQL Connection Failed:');
        console.error('Error Code:', err.code);
        console.error('Message:', err.message);

        if (err.code === '28P01') {
            console.error('👉 Tip: Check your DB_PASSWORD in the .env file.');
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            console.error('👉 Tip: Ensure DB_HOST is correct and the database allows remote connections.');
        }

        return { success: false, error: err.message };
    }
}
