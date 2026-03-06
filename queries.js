require('dotenv').config()
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_UNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_INSTANCE,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
});

const filterHeaders = (headers) => {
  const jaegerHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-flags', 'b3'];
  const filteredHeaders = Object.keys(headers)
    .filter(key => jaegerHeaders.includes(key))
    .reduce((obj, key) => {
      obj[key] = headers[key];
      return obj;
    }, {});

  return filteredHeaders;
}

const insertComment = (request, response) => {
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  const { reviewid, comment } = request.body;

  pool.query('INSERT INTO comments (reviewid,comment) VALUES ($1,$2) RETURNING *', [reviewid, comment], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
      //console.log(`${key}: ${user[key]}`);
    }
    const cid = results.rows[0].id
    response.status(201).json({ commentID: cid, status: "created" })
  })
};

const updateComment = (request, response) => {
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  const cid = parseInt(request.params.cid);
  const { reviewid, comment } = request.body;

  pool.query('UPDATE comments SET reviewid=$1,comment=$2 WHERE id=$3', [reviewid, comment, cid], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
      //console.log(`${key}: ${user[key]}`);
    }
    response.status(201).json({ commentID: cid, status: "updated" })
  })
};

const updateCommentByRid = (request, response) => {
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  const rid = parseInt(request.params.rid);
  const { comment } = request.body;

  pool.query('UPDATE comments SET comment=$1 WHERE reviewid=$2', [comment, rid], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
      //console.log(`${key}: ${user[key]}`);
    }
    response.status(201).json({ commentID: rid, status: "updated" })
  })
};

const deleteComment = (request, response) => {
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  const cid = parseInt(request.params.cid);

  pool.query('DELETE FROM comments WHERE id=$1', [cid], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
      //console.log(`${key}: ${user[key]}`);
    }
    response.status(201).json({ commentID: cid, status: "deleted" })
  })
};

const deleteCommentByRid = (request, response) => {
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  const rid = parseInt(request.params.rid);

  pool.query('DELETE FROM comments WHERE reviewid=$1', [rid], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
      //console.log(`${key}: ${user[key]}`);
    }
    response.status(201).json({ commentID: rid, status: "deleted" })
  })
};

// const getAllComment = (request, response) => {
//   const headers = request.headers;
//   const filteredHeaders = filterHeaders(headers);

//   pool.query('SELECT * FROM comments', (error, results) => {
//     if (error) {
//       throw error
//     }
//     for (const key in filteredHeaders) {
//       response.setHeader(key, filteredHeaders[key]);
//     }
//     response.setHeader("fromhost", process.env.HOSTNAME)
//     response.status(200).json(results.rows)
//   })
// };


const getAllComment = (req, res) => {
  const id = req.query.id;

  const query = "SELECT * FROM comments WHERE id = " + id;

  pool.query(query, (err, result) => {
    if (err) throw err;
    res.json(result.rows);
  });
};



const getCommentByCid = (request, response) => {
  const cid = parseInt(request.params.cid);
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  pool.query('SELECT id,comment FROM comments WHERE id = $1', [cid], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
    }
    response.status(200).json(results.rows)
  })
};

const getCommentByRid = (request, response) => {
  const rid = parseInt(request.params.rid);
  const headers = request.headers;
  const filteredHeaders = filterHeaders(headers);

  pool.query('SELECT id,comment FROM comments WHERE reviewid = $1', [rid], (error, results) => {
    if (error) {
      throw error
    }
    for (const key in filteredHeaders) {
      response.setHeader(key, filteredHeaders[key]);
    }
    response.status(200).json(results.rows)
  })
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