var express = require("express");
var router = express.Router();
var downloader = require("../utility/downloader");

/* POST download poster. */
router.post("/", async function (req, res, next) {
  const result = await downloader(req.body.startDate, req.body.endDate);
  res.send(result);
});

module.exports = router;
