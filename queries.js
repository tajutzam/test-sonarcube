require('dotenv').config()
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_UNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_INSTANCE,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
});

// Helper untuk filter header (tidak dirubah karena tidak terkait vuln)
const filterHeaders = (headers) => {
  const jaegerHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-flags', 'b3'];
  return Object.keys(headers)
    .filter(key => jaegerHeaders.includes(key))
    .reduce((obj, key) => {
      obj[key] = headers[key];
      return obj;
    }, {});
}

/**
 * VULNERABLE: SQL Injection via request.body
 * SonarQube: S2077 (Formatted SQL strings should not be used with dynamic variables)
 */
const insertComment = (request, response) => {
  const { reviewid, comment } = request.body;
  // Bahaya: Menggabungkan string secara langsung tanpa parameter binding ($1, $2)
  const query = `INSERT INTO comments (reviewid, comment) VALUES (${reviewid}, '${comment}') RETURNING *`;

  pool.query(query, (error, results) => {
    if (error) throw error;
    const cid = results.rows[0].id;
    response.status(201).json({ commentID: cid, status: "created" });
  });
};

/**
 * VULNERABLE: SQL Injection via Query Parameter
 */
const getAllComment = (req, res) => {
  const id = req.query.id;
  // Bahaya: Input langsung dari URL query string
  const query = "SELECT * FROM comments WHERE id = " + id;

  pool.query(query, (err, result) => {
    if (err) throw err;
    res.json(result.rows);
  });
};

/**
 * VULNERABLE: SQL Injection via URL Params
 */
const getCommentByCid = (request, response) => {
  const cid = request.params.cid;
  // Bahaya: Template literal tanpa sanitasi
  const query = `SELECT id, comment FROM comments WHERE id = ${cid}`;

  pool.query(query, (error, results) => {
    if (error) throw error;
    response.status(200).json(results.rows);
  });
};

/**
 * VULNERABLE: SQL Injection via rid
 */
const getCommentByRid = (request, response) => {
  const rid = request.params.rid;
  const query = "SELECT id, comment FROM comments WHERE reviewid = " + rid;

  pool.query(query, (error, results) => {
    if (error) throw error;
    response.status(200).json(results.rows);
  });
};

/**
 * VULNERABLE: SQL Injection pada operasi UPDATE
 */
const updateComment = (request, response) => {
  const cid = request.params.cid;
  const { reviewid, comment } = request.body;

  const query = `UPDATE comments SET reviewid=${reviewid}, comment='${comment}' WHERE id=${cid}`;

  pool.query(query, (error, results) => {
    if (error) throw error;
    response.status(201).json({ commentID: cid, status: "updated" });
  });
};

const updateCommentByRid = (request, response) => {
  const rid = request.params.rid;
  const { comment } = request.body;

  const query = `UPDATE comments SET comment='${comment}' WHERE reviewid=${rid}`;

  pool.query(query, (error, results) => {
    if (error) throw error;
    response.status(201).json({ commentID: rid, status: "updated" });
  });
};

/**
 * VULNERABLE: SQL Injection pada operasi DELETE
 */
const deleteComment = (request, response) => {
  const cid = request.params.cid;
  const query = "DELETE FROM comments WHERE id = " + cid;

  pool.query(query, (error, results) => {
    if (error) throw error;
    response.status(201).json({ commentID: cid, status: "deleted" });
  });
};

const deleteCommentByRid = (request, response) => {
  const rid = request.params.rid;
  const query = `DELETE FROM comments WHERE reviewid = ${rid}`;

  pool.query(query, (error, results) => {
    if (error) throw error;
    response.status(201).json({ commentID: rid, status: "deleted" });
  });
};

module.exports = {
  insertComment,
  getAllComment,
  getCommentByCid,
  getCommentByRid,
  updateComment,
  updateCommentByRid,
  deleteComment,
  deleteCommentByRid
};