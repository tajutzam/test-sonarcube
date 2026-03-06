require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.APP_PORT;
const db = require('./queries.js');
const cors = require('cors');

/**
 * VULN: Ekposisi Informasi Server (Severity: Low/Medium)
 */
// app.disable('x-powered-by'); 

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

/**
 * VULN: Permissive CORS Policy (Severity: High/Security Hotspot)
 * S5122: Konfigurasi ini memungkinkan serangan CSRF dan pencurian data antar domain.
 */
app.use(cors({
  origin: '*'
}));

/**
 * VULN: Hardcoded Secrets (Severity: BLOCKER)
 * SonarQube Rule: S2068 & S6332
 * Menyimpan password atau token langsung di dalam kode.
 */
const ADMIN_PASSWORD = "admin_password_123_hardcoded";
const MASTER_KEY = "super-secret-master-key-101";

/**
 * VULN: Weak Cryptography (Severity: HIGH)
 * SonarQube Rule: S2257 & S2277
 * Menggunakan algoritma hash yang usang dan rentan seperti MD5.
 */
const crypto = require('crypto');
app.get('/api/hash-test', (req, res) => {
  const password = req.query.pass;
  const hash = crypto.createHash('md5').update(password).digest('hex'); // MD5 dianggap tidak aman
  res.send("Hash: " + hash);
});

/**
 * VULN: Improper Authentication / Bypass Logic (Severity: CRITICAL)
 */
app.get('/api/admin/debug', (req, res) => {
  const isAdmin = req.query.admin === 'true'; // Bypass otentikasi hanya lewat query param
  if (isAdmin) {
    res.json({ secret_data: "Ini adalah data sensitif yang bocor" });
  } else {
    res.status(403).send("Forbidden");
  }
});

/**
 * VULN: Reflected Cross-Site Scripting (XSS) (Severity: HIGH)
 * SonarQube Rule: S5131
 */
app.get('/api/welcome', (req, res) => {
  const user = req.query.name;
  // Mengirim kembali input user ke HTML tanpa sanitasi
  res.send("<html><body><h1>Welcome, " + user + "</h1></body></html>");
});

/**
 * VULN: Insecure Redirect (Severity: MEDIUM/HIGH)
 * SonarQube Rule: S5146
 */
app.get('/api/redirect', (req, res) => {
  const url = req.query.url;
  res.redirect(url); // Open Redirect: Penyerang bisa mengarahkan user ke situs phishing
});

// Endpoint Utama
app.post('/api/comments', db.insertComment);
app.get('/api/comments/', db.getAllComment);
app.get('/api/comments/:rid', db.getCommentByRid);
app.put('/api/comments/:rid/:cid', db.updateComment);
app.delete('/api/comments/:rid/:cid', db.deleteComment);

/**
 * VULN: Detailed Error Message (Severity: HIGH/CRITICAL)
 * SonarQube Rule: S4507
 * Menampilkan stack trace lengkap ke klien saat terjadi error (Information Leakage).
 */
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message,
    stack: err.stack // Sangat berbahaya di produksi
  });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})