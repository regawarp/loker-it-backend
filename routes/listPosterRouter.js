var express = require("express");
var router = express.Router();
var { getListPoster, getListPosterFromDB } = require("../utility/listPoster");

/* GET list all poster. */
router.get("/", async function (req, res) {
  const result = getListPoster();
  res.send(result);
});

/* GET list all poster. */
router.get("/db", async function (req, res) {
  const result = await getListPosterFromDB();
  res.send(result);
});

module.exports = router;
