const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

const dataFilePath = path.join(__dirname, 'data.json');

// Helper function to read data
const readData = () => {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading data:", err);
        return [];
    }
};

// Helper function to write data
const writeData = (data) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing data:", err);
    }
};

// GET all contacts
app.get('/api/contacts', (req, res) => {
    const contacts = readData();
    res.json(contacts);
}); 

// POST a new contact
app.post('/api/contacts', (req, res) => {
    const newContact = req.body;
    const contacts = readData();

    // Auto-increment ID if needed
    if (!newContact.id) {
        newContact.id = contacts.length > 0 ? contacts[contacts.length - 1].id + 1 : 1;
    }

    contacts.push(newContact);
    writeData(contacts);

    res.status(201).json(newContact);
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
