// server.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Phục vụ file tĩnh trong thư mục public
app.use(express.static('public'));

// Tạo hoặc mở cơ sở dữ liệu history.db
const db = new sqlite3.Database('history.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter TEXT,
    operation TEXT,
    input TEXT,
    result TEXT,
    created_at TEXT
  )`);
});

// Hàm lưu lịch sử
function saveHistory(chapter, operation, input, result) {
  const time = new Date().toLocaleString('vi-VN');
  db.run(
    `INSERT INTO history (chapter, operation, input, result, created_at) VALUES (?,?,?,?,?)`,
    [chapter, operation, JSON.stringify(input), JSON.stringify(result), time]
  );
}

// ========== CÁC API CHƯƠNG 1 ==========

// 1. P(A ∪ B)
app.post('/api/ch1/union', (req, res) => {
  const { pA, pB, pAnB } = req.body;
  if ([pA, pB, pAnB].some(x => x < 0 || x > 1)) return res.status(400).json({ error: 'Xác suất phải trong [0,1]' });
  const result = pA + pB - pAnB;
  saveHistory('Chương 1', 'Union', req.body, result);
  res.json({ result });
});

// 2. P(A ∩ B) (độc lập)
app.post('/api/ch1/intersection_independent', (req, res) => {
  const { pA, pB } = req.body;
  if ([pA, pB].some(x => x < 0 || x > 1)) return res.status(400).json({ error: 'Xác suất phải trong [0,1]' });
  const result = pA * pB;
  saveHistory('Chương 1', 'Intersection independent', req.body, result);
  res.json({ result });
});

// 3. P(A|B)
app.post('/api/ch1/conditional', (req, res) => {
  const { pAnB, pB } = req.body;
  if ([pAnB, pB].some(x => x < 0 || x > 1)) return res.status(400).json({ error: 'Xác suất phải trong [0,1]' });
  if (pB === 0) return res.status(400).json({ error: 'P(B) không được bằng 0' });
  const result = pAnB / pB;
  saveHistory('Chương 1', 'Conditional', req.body, result);
  res.json({ result });
});

// 4. Bayes
app.post('/api/ch1/bayes', (req, res) => {
  const { pA, pB_given_A, pB_given_notA } = req.body;
  if ([pA, pB_given_A, pB_given_notA].some(x => x < 0 || x > 1))
    return res.status(400).json({ error: 'Xác suất phải trong [0,1]' });

  const numerator = pB_given_A * pA;
  const denominator = numerator + pB_given_notA * (1 - pA);
  const result = denominator === 0 ? 0 : numerator / denominator;

  saveHistory('Chương 1', 'Bayes', req.body, result);
  res.json({ result });
});

// API xem lịch sử
app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM history ORDER BY id DESC LIMIT 20', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Chạy server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
