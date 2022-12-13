const schedule = require("node-schedule");
const db = require("./postgres");
const { ScheduledTweets } = require("../utility/scheduledTweets");
const tweets = require('../utility/tweets');

require("dotenv").config();

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
  console.log('Running scheduler...');
  console.log('Getting all scheduled tweet...');

  const scheduledTweets = await ScheduledTweets.getScheduledTweets();
  console.log(scheduledTweets.length, 'scheduled tweets found!');

  for (let i = 0; i < scheduledTweets.length; i++) {
    const { tweet_id, tweet_caption_text, tweet_scheduled_date, tweet_posters } = scheduledTweets[i];
    const imageUrl = tweet_posters.map(poster => process.env.BE_URL + poster.poster_image_path)
    // console.log(tweet_id, tweet_caption_text, tweet_scheduled_date, imageUrl);

    const timeNow = new Date();
    const timeSchedule = new Date(tweet_scheduled_date);
    if (timeNow > timeSchedule) continue;
    console.log('tweet', tweet_id, 'will be posted at', timeSchedule.toString());

    const job = schedule.scheduleJob(tweet_id, timeSchedule, async function () {
      const error = await tweets.postTweetFromImageUrl(imageUrl, tweet_caption_text);
      if (!error) console.log('tweet', tweet_id, 'posted!');
      else console.log('tweet', tweet_id, 'not posted!');
    });
  }
}

module.exports = runScheduler;
