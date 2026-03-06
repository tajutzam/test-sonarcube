require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.APP_PORT;
const db = require('./queries.js');
const cors = require('cors');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cors({
  origin: '*'
}));

app.post('/api/comments', db.insertComment);
app.get('/api/comments/', db.getAllComment);
app.get('/api/comments/:rid', db.getCommentByRid);
app.put('/api/comments/:rid/:cid', db.updateComment);
app.delete('/api/comments/:rid/:cid', db.deleteComment);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})