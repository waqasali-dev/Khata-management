const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'udhar',
    password: 'kashi2002',
    port: 5432,
});
// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

app.post('/api/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const query = 'SELECT * FROM users WHERE name = $1';
        pool.query(query, [name], async (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack);
                res.status(500).send('Error logging in');
            } else {
                if (result.rows.length === 0) {
                    res.status(401).send('Invalid credentials');
                } else {
                    const match = await bcrypt.compare(password, result.rows[0].password);
                    if (match) {
                        res.status(200).send('Login successful');
                    } else {
                        res.status(401).send('Invalid credentials');
                    }
                }
            }
        });
    } catch (error) {
        console.log('Error in bcrypt', error);
        res.status(500).send('Error logging in');
    }
})

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    console.log("hit");
    try {
        const hashedpassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
        pool.query(query, [name, email, hashedpassword], (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack);
                res.status(500).send('Error creating account');
            } else {
                res.status(201).send('Account created successfully');
            }
        });
    } catch (error) {
        console.log('Error in bcrypt', error);
        res.status(500).send('Error creating account');
    }
})


app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
