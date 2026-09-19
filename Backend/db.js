const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'udhar',
  password: process.env.PGPASSWORD || 'kashi2002',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

async function initDb() {
  try {
    // Create tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS udhar (
        udhar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        identity VARCHAR(255) NOT NULL,
        amount INT NOT NULL CHECK (amount > 0),
        type VARCHAR(255) NOT NULL CHECK (type IN ('udhar', 'payment')),
        date DATE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE udhar ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_udhar_user ON udhar (user_id);
      CREATE INDEX IF NOT EXISTS idx_udhar_contact ON udhar (user_id, name, identity);
    `);

    console.log('Database tables & indexes verified successfully.');
  } catch (err) {
    console.error('Database initialization warning / error:', err.message);
  }
}

module.exports = { pool, initDb };
