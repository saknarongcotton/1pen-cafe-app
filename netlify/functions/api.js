const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Aiven MySQL (using Netlify Environment Variables)
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ==========================================
// 📦 STOCK API ROUTES
// ==========================================
app.get('/api/stock', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM stock ORDER BY name ASC');
    res.json(rows);
});

app.post('/api/stock', async (req, res) => {
    const { name, qty } = req.body;
    await pool.query('INSERT INTO stock (name, qty) VALUES (?, ?)', [name, qty]);
    res.json({ success: true });
});

app.put('/api/stock/:id', async (req, res) => {
    const { qty } = req.body;
    await pool.query('UPDATE stock SET qty = ? WHERE id = ?', [qty, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/stock/:id', async (req, res) => {
    await pool.query('DELETE FROM stock WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// ==========================================
// 📅 CALENDAR SHIFTS API ROUTES
// ==========================================
app.get('/api/shifts', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM shifts');
    res.json(rows);
});

app.post('/api/shifts', async (req, res) => {
    const { shift_date, emp_name, status, remark } = req.body;
    await pool.query('DELETE FROM shifts WHERE shift_date = ? AND emp_name = ?', [shift_date, emp_name]);
    await pool.query('INSERT INTO shifts (shift_date, emp_name, status, remark) VALUES (?, ?, ?, ?)', [shift_date, emp_name, status, remark]);
    res.json({ success: true });
});

app.delete('/api/shifts/:id', async (req, res) => {
    await pool.query('DELETE FROM shifts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// Export the serverless app
module.exports.handler = serverless(app);