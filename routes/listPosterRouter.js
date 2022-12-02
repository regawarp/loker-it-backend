var express = require("express");
var router = express.Router();
var listPoster = require("../utility/listPoster");

/* GET list poster. */
router.get("/", async function (req, res) {
  const result = await listPoster();
  res.send(result);
});

module.exports = router;
