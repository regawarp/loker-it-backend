const schedule = require("node-schedule");
const db = require("./postgres");

async function getScheduledTweets() {
  const query = `select * from tweets where tweet_status = 0`;

  return await db
    .many(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get scheduled tweets:", error);
    });
}

async function getPosters(tweetId) {
  const query = `select * from posters where poster_tweet_id = ${tweetId}`;
  return await db
    .many(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get posters:", error);
    });
}

async function runScheduler() {

}

module.exports = runScheduler;
