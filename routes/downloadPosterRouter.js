var express = require("express");
var router = express.Router();
var downloadPoster = require("../utility/downloadPoster");

/* POST download poster. */
router.post("/", async function (req, res, next) {
  const result = await downloadPoster(req.body.startDate, req.body.endDate);
  res.send(result);
});

module.exports = router;
