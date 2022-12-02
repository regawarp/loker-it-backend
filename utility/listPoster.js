const glob = require("glob");

function getListPoster() {
  const POSTER_PATH = "./public/media"; 
  const PATTERN = "/**/*.jpg";

  return glob
    .sync(POSTER_PATH + PATTERN)
    .map((x) => x.replace(/.\/public/g, process.env.BE_URL));
}

module.exports = getListPoster;
