require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.APP_PORT;
const db = require('./queries.js');
const cors = require('cors');

/**
 * VULN: Ekposisi Informasi Server
 * SonarQube akan mendeteksi bahwa "X-Powered-By" header tidak dinonaktifkan.
 * Ini membantu penyerang mengidentifikasi teknologi yang digunakan (Express).
 */
// app.disable('x-powered-by'); // Baris ini sengaja dikomentari agar vuln

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

/**
 * VULN: Permissive CORS Policy (CWE-942)
 * SonarQube Rule: S5122
 * Menggunakan '*' sangat berbahaya karena mengizinkan domain apa pun 
 * melakukan cross-origin request.
 */
app.use(cors({
  origin: '*'
}));

/**
 * VULN: Ketiadaan Proteksi CSRF
 * SonarQube sering menandai endpoint POST/PUT/DELETE yang tidak menggunakan 
 * token anti-CSRF (seperti library 'csurf').
 */

app.post('/api/comments', db.insertComment);

/**
 * VULN: Reflected Cross-Site Scripting (XSS) - Contoh Endpoint Tambahan
 * Jika Anda ingin mengetes XSS, SonarQube akan mendeteksi jika data dari user
 * langsung dikirim kembali tanpa sanitasi.
 */
app.get('/api/echo', (req, res) => {
  const input = req.query.text;
  res.send("<h1>Echo: " + input + "</h1>"); // S5131: Reflected XSS
});

app.get('/api/comments/', db.getAllComment);
app.get('/api/comments/:rid', db.getCommentByRid);
app.put('/api/comments/:rid/:cid', db.updateComment);
app.delete('/api/comments/:rid/:cid', db.deleteComment);

/**
 * VULN: Penggunaan Stack Trace Mentah (Information Exposure)
 * Jika server error, stack trace akan muncul di console. 
 * Pastikan error di queries.js tidak ditangkap middleware pengolah error yang aman.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})