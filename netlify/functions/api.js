const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const serverless = require('serverless-http');

const app = express();
const router = express.Router(); 

app.use(cors());
app.use(express.json());

// 1. Connect to Aiven (LOOK HERE: We changed DATABASE_URL to CAFE_DB_URL)
const pool = mysql.createPool({
    uri: process.env.CAFE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

// 2. Auto-Create Tables
async function checkTables() {
    await pool.query(`CREATE TABLE IF NOT EXISTS stock (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, qty INT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS shifts (id INT AUTO_INCREMENT PRIMARY KEY, shift_date VARCHAR(10) NOT NULL, emp_name VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, remark VARCHAR(255))`);
}

// ==========================================
// 📦 STOCK API ROUTES
// ==========================================
router.get('/stock', async (req, res) => {
    try {
        await checkTables();
        const [rows] = await pool.query('SELECT * FROM stock ORDER BY name ASC');
        res.json(rows);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/stock', async (req, res) => {
    try {
        await checkTables();
        const { name, qty } = req.body;
        await pool.query('INSERT INTO stock (name, qty) VALUES (?, ?)', [name, qty]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/stock/:id', async (req, res) => {
    try {
        const { qty } = req.body;
        await pool.query('UPDATE stock SET qty = ? WHERE id = ?', [qty, req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/stock/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM stock WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📅 CALENDAR SHIFTS API ROUTES
// ==========================================
router.get('/shifts', async (req, res) => {
    try {
        await checkTables();
        const [rows] = await pool.query('SELECT * FROM shifts');
        res.json(rows);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/shifts', async (req, res) => {
    try {
        await checkTables();
        const { shift_date, emp_name, status, remark } = req.body;
        
        await pool.query('DELETE FROM shifts WHERE shift_date = ? AND emp_name = ?', [shift_date, emp_name]);
        await pool.query('INSERT INTO shifts (shift_date, emp_name, status, remark) VALUES (?, ?, ?, ?)', [shift_date, emp_name, status, remark]);
        
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/shifts/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM shifts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// 3. Bind the router to BOTH URL paths
app.use('/api', router);
app.use('/.netlify/functions/api', router);

// Export for Netlify
module.exports.handler = serverless(app);
