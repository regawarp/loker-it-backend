var express = require("express");
var router = express.Router();
var downloader = require("../utility/downloader");

/* GET users listing. */
router.get("/", async function (req, res, next) {
  const result = await downloader();
  res.send(result);
});

module.exports = router;
