const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { pool, initDb } = require('./db');
const { validateEmail, sanitizeString, validateAmount, validateTransactionType } = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbRes.rows[0].now,
      uptime: process.uptime(),
      version: '1.1.0'
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// User Signup
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long' });
  }

  try {
    const existing = await pool.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING user_id, name, email
    `;
    const result = await pool.query(query, [name.trim(), email.trim().toLowerCase(), hashedPassword]);
    const newUser = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ success: false, error: 'Error creating account. Please try again.' });
  }
});

// User Login (accepts either email or name along with password)
app.post('/api/login', async (req, res) => {
  const { email, name, password } = req.body;
  const identifier = (email || name || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Email/Username and password are required' });
  }

  try {
    const query = `
      SELECT * FROM users
      WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)
      LIMIT 1
    `;
    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid password. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// ----------------------------------------------------
// CONTACTS & UDHAR LEDGER ENDPOINTS
// ----------------------------------------------------

// Helper to calculate aggregate contacts list from udhar rows
async function getContactsForUser(userId) {
  const query = `
    SELECT
      udhar_id,
      name,
      identity,
      amount,
      type,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      created_at
    FROM udhar
    WHERE user_id = $1
    ORDER BY date DESC, created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  const rows = result.rows;

  // Group by (name + ':::' + identity)
  const contactMap = new Map();

  for (const row of rows) {
    const key = `${row.name.trim().toLowerCase()}:::${row.identity.trim().toLowerCase()}`;
    if (!contactMap.has(key)) {
      contactMap.set(key, {
        id: key,
        name: row.name,
        identity: row.identity,
        amount: 0,
        totalUdhar: 0,
        totalPayment: 0,
        udhars: [],
      });
    }

    const contact = contactMap.get(key);
    const amountNum = Number(row.amount);

    if (row.type === 'udhar') {
      contact.amount += amountNum;
      contact.totalUdhar += amountNum;
    } else if (row.type === 'payment') {
      contact.amount -= amountNum;
      contact.totalPayment += amountNum;
    }

    contact.udhars.push({
      udhar_id: row.udhar_id,
      amount: amountNum,
      type: row.type,
      date: row.date,
      created_at: row.created_at,
    });
  }

  return Array.from(contactMap.values());
}

// GET all contacts and their udhars for a user
app.get('/api/contacts', async (req, res) => {
  const { user_id, search } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    let contacts = await getContactsForUser(user_id);

    if (search) {
      const q = search.trim().toLowerCase();
      contacts = contacts.filter(
        (c) => c.name.toLowerCase().includes(q) || c.identity.toLowerCase().includes(q)
      );
    }

    res.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

// POST new contact with initial entry
app.post('/api/contacts', async (req, res) => {
  const { user_id, name, identity, udhar, amount, type = 'udhar', date } = req.body;
  const recordAmount = Number(udhar || amount || 0);
  const entryDate = date || new Date().toISOString().split('T')[0];

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Contact name is required' });
  }

  try {
    const contactName = name.trim();
    const contactIdentity = (identity || '').trim();

    // If an initial amount is provided, record the initial transaction
    if (recordAmount > 0) {
      const insertQuery = `
        INSERT INTO udhar (user_id, name, identity, amount, type, date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      await pool.query(insertQuery, [
        user_id,
        contactName,
        contactIdentity,
        recordAmount,
        type,
        entryDate,
      ]);
    }

    // Return the updated contacts list for the user
    const contacts = await getContactsForUser(user_id);
    const createdContact = contacts.find(
      (c) =>
        c.name.toLowerCase() === contactName.toLowerCase() &&
        c.identity.toLowerCase() === contactIdentity.toLowerCase()
    ) || {
      id: `${contactName}:::${contactIdentity}`,
      name: contactName,
      identity: contactIdentity,
      amount: recordAmount > 0 ? (type === 'udhar' ? recordAmount : -recordAmount) : 0,
      totalUdhar: type === 'udhar' ? recordAmount : 0,
      totalPayment: type === 'payment' ? recordAmount : 0,
      udhars: [],
    };

    res.status(201).json({
      success: true,
      message: 'Contact saved successfully',
      contact: createdContact,
    });
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ error: 'Error creating contact' });
  }
});

// POST a new transaction (Udhar or Payment)
app.post('/api/udhar', async (req, res) => {
  const { user_id, name, identity, amount, type, date } = req.body;

  if (!user_id || !name || !type || !amount) {
    return res.status(400).json({
      error: 'user_id, name, amount, and type are required',
    });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  if (!['udhar', 'payment'].includes(type.toLowerCase())) {
    return res.status(400).json({ error: "Type must be either 'udhar' or 'payment'" });
  }

  const entryDate = date || new Date().toISOString().split('T')[0];

  try {
    const query = `
      INSERT INTO udhar (user_id, name, identity, amount, type, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        udhar_id,
        name,
        identity,
        amount,
        type,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        created_at
    `;
    const result = await pool.query(query, [
      user_id,
      name.trim(),
      (identity || '').trim(),
      numAmount,
      type.toLowerCase(),
      entryDate,
    ]);

    res.status(201).json({
      success: true,
      message: `${type === 'udhar' ? 'Udhar' : 'Payment'} recorded successfully`,
      udhar: result.rows[0],
    });
  } catch (err) {
    console.error('Error recording udhar:', err);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// DELETE a transaction by udhar_id
app.delete('/api/udhar/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  try {
    let deleteQuery = 'DELETE FROM udhar WHERE udhar_id = $1';
    let params = [id];

    if (user_id) {
      deleteQuery += ' AND user_id = $2';
      params.push(user_id);
    }

    const result = await pool.query(deleteQuery, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting udhar:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// DELETE all transactions for a contact
app.delete('/api/contacts', async (req, res) => {
  const { user_id, name, identity } = req.body;

  if (!user_id || !name) {
    return res.status(400).json({ error: 'user_id and name are required' });
  }

  try {
    const query = `
      DELETE FROM udhar
      WHERE user_id = $1
        AND LOWER(name) = LOWER($2)
        AND LOWER(identity) = LOWER($3)
    `;
    await pool.query(query, [user_id, name.trim(), (identity || '').trim()]);

    res.json({ success: true, message: 'Contact and ledger deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// GET ledger summary statistics
app.get('/api/summary', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'udhar' THEN amount ELSE 0 END), 0) AS total_udhar,
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) AS total_payment,
        COUNT(DISTINCT (name || ':::' || identity)) AS total_contacts,
        COUNT(*) AS total_transactions
      FROM udhar
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    const row = result.rows[0];

    const totalUdhar = Number(row.total_udhar);
    const totalPayment = Number(row.total_payment);

    res.json({
      totalUdhar,
      totalPayment,
      netBalance: totalUdhar - totalPayment,
      totalContacts: Number(row.total_contacts),
      totalTransactions: Number(row.total_transactions),
    });
  } catch (err) {
    console.error('Error calculating summary:', err);
    res.status(500).json({ error: 'Failed to retrieve summary statistics' });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  await initDb();
});

module.exports = app;
