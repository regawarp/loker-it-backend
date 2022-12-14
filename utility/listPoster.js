const glob = require("glob");
const path = require("path");
const db = require("../utility/postgres");

function getListPoster() {
  const POSTER_PATH = "./public/media";
  const PATTERN = "/**/*.jpg";

  return glob.sync(POSTER_PATH + PATTERN).map((x) => ({
    filename: path.basename(x),
    group:
      path.basename(path.dirname(x)) !== "media"
        ? path.basename(path.dirname(x))
        : undefined,
    url: x.replace(/.\/public/g, ""),
  }));
}

async function getListPosterFromDB(page = 1, pageSize = 5) {
  const query = `select p.poster_id, replace(p.poster_image_path, './public', '') as poster_image_path,
                  p.poster_group, p.poster_message_date, p.poster_created_date,
                  regexp_replace(p.poster_image_path, '[\.\/a-zA-Z0-9]+/','', 'g') as filename
                  from posters p where p.poster_tweet_id is null order by p.poster_message_date;`;

  const posters = await db
    .manyOrNone(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get posters:", error);
    });

  return posters;
}

module.exports = { getListPoster, getListPosterFromDB };
