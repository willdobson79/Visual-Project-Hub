import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false, // Set to true or { rejectUnauthorized: false } if using a cloud DB that requires SSL.
    // If you see "no pg_hba.conf entry... no encryption", you likely need to whitelist your IP in your DB provider.
});

export const pgQuery = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG) {
        console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
};

export default pool;
