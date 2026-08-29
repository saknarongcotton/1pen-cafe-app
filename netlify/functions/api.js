const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const serverless = require('serverless-http');

const app = express();
const router = express.Router(); 

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    uri: process.env.CAFE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

// Auto-Create ALL Tables
async function checkTables() {
    // Main Cafe Tables
    await pool.query(`CREATE TABLE IF NOT EXISTS stock (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, qty INT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS shifts (id INT AUTO_INCREMENT PRIMARY KEY, shift_date VARCHAR(10) NOT NULL, emp_name VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, remark VARCHAR(255))`);
    
    // Shasha's Isolated Tables
    await pool.query(`CREATE TABLE IF NOT EXISTS shasha_stock (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, qty INT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS shasha_timeframes (id INT AUTO_INCREMENT PRIMARY KEY, date_key VARCHAR(10) NOT NULL, start_time VARCHAR(10), end_time VARCHAR(10), title VARCHAR(255), location_url VARCHAR(500))`);
    
    // NEW: Shasha's 6-in-1 Notes Table
    await pool.query(`CREATE TABLE IF NOT EXISTS shasha_notes (id INT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(50) NOT NULL, text1 TEXT, text2 TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
}

// ==========================================
// 📦 STOCK API
// ==========================================
router.get('/stock', async (req, res) => {
    try {
        await checkTables();
        const table = req.query.user === 'shasha' ? 'shasha_stock' : 'stock';
        const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY name ASC`);
        res.json(rows);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/stock', async (req, res) => {
    try {
        const table = req.query.user === 'shasha' ? 'shasha_stock' : 'stock';
        const { name, qty } = req.body;
        await pool.query(`INSERT INTO ${table} (name, qty) VALUES (?, ?)`, [name, qty]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/stock/:id', async (req, res) => {
    try {
        const table = req.query.user === 'shasha' ? 'shasha_stock' : 'stock';
        const { qty } = req.body;
        await pool.query(`UPDATE ${table} SET qty = ? WHERE id = ?`, [qty, req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/stock/:id', async (req, res) => {
    try {
        const table = req.query.user === 'shasha' ? 'shasha_stock' : 'stock';
        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📅 MAIN CAFE SHIFTS API
// ==========================================
router.get('/shifts', async (req, res) => {
    try {
        await checkTables();
        const [rows] = await pool.query(`SELECT * FROM shifts`);
        res.json(rows);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/shifts', async (req, res) => {
    try {
        const { shift_date, emp_name, status, remark } = req.body;
        await pool.query(`DELETE FROM shifts WHERE shift_date = ? AND emp_name = ?`, [shift_date, emp_name]);
        await pool.query(`INSERT INTO shifts (shift_date, emp_name, status, remark) VALUES (?, ?, ?, ?)`, [shift_date, emp_name, status, remark]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/shifts/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM shifts WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🌸 SHASHA TIMEFRAME/LOCATION API
// ==========================================
router.get('/timeframes', async (req, res) => {
    try {
        await checkTables();
        const [rows] = await pool.query('SELECT * FROM shasha_timeframes');
        res.json(rows);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/timeframes', async (req, res) => {
    try {
        const { date_key, start_time, end_time, title, location_url } = req.body;
        await pool.query('INSERT INTO shasha_timeframes (date_key, start_time, end_time, title, location_url) VALUES (?, ?, ?, ?, ?)', [date_key, start_time, end_time, title, location_url]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/timeframes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM shasha_timeframes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 📓 SHASHA 6-IN-1 NOTES API
// ==========================================
router.get('/notes', async (req, res) => {
    try {
        await checkTables();
        const [rows] = await pool.query('SELECT * FROM shasha_notes ORDER BY id ASC');
        res.json(rows);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/notes', async (req, res) => {
    try {
        const { category, text1, text2 } = req.body;
        await pool.query('INSERT INTO shasha_notes (category, text1, text2) VALUES (?, ?, ?)', [category, text1, text2]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/notes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM shasha_notes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.use('/api', router);
app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
