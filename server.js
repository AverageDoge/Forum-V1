const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Allow your GitHub Pages frontend to talk to this backend
app.use(cors({ origin: '*' }));
app.use(express.json());

// Set up the TiDB Connection
// Render will grab the DATABASE_URL environment variable we set later
const pool = mysql.createPool(process.env.DATABASE_URL);

// Route: Get all posts
app.get('/posts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM forum_posts ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route: Submit a new post
app.post('/posts', async (req, res) => {
    try {
        const { title, category, content, date } = req.body;
        await pool.query(
            'INSERT INTO forum_posts (title, category, content, date, status) VALUES (?, ?, ?, ?, ?)',
            [title, category, content, date, 'pending']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route: Admin approves a post
app.post('/approve', async (req, res) => {
    try {
        const { id } = req.body;
        await pool.query('UPDATE forum_posts SET status = ? WHERE id = ?', ['approved', id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route: Admin deletes/rejects a post
app.post('/delete', async (req, res) => {
    try {
        const { id } = req.body;
        await pool.query('DELETE FROM forum_posts WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
