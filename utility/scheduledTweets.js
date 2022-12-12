const pgp = require("pg-promise")();
const db = require("../utility/postgres");

const ScheduledTweets = {
  getScheduledTweets,
};

async function getScheduledTweets(page = 1, pageSize = 5) {
  const query = `select tweet_id, tweet_caption_text, tweet_scheduled_date, 
                  array_agg(replace(p.poster_image_path, './public', '')) as tweet_poster_image_paths
                  from tweets t 
                  inner join posters p on t.tweet_id = p.poster_tweet_id
                  group by t.tweet_id
                  order by t.tweet_scheduled_date;`;
  
  const scheduledTweets = await db
    .manyOrNone(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get scheduled tweets:", error);
    });

  return scheduledTweets;
}

module.exports = {
  ScheduledTweets
}