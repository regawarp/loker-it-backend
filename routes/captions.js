var express = require('express');
const db = require('../utility/postgres');
var router = express.Router();

var postgresdb = require('../utility/postgres');

/* Add a caption. */
router.post('/', function (req, res, next) {
  db.none('insert into captions(caption_text) VALUES($1)', [req.body.caption_text])
    .then(() => {
      res.send('success!');
    })
    .catch(error => {
      console.log('Error :', error);
      res.send('failed!');
    });
});

module.exports = router;