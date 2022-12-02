const glob = require("glob");
const path = require("path");

function getListPoster() {
  const POSTER_PATH = "./public/media";
  const PATTERN = "/**/*.jpg";

  return glob.sync(POSTER_PATH + PATTERN).map((x) => ({
    filename: path.basename(x),
    group:
      path.basename(path.dirname(x)) !== "media"
        ? path.basename(path.dirname(x))
        : undefined,
    url: x.replace(/.\/public/g, process.env.BE_URL),
  }));
}

module.exports = getListPoster;
