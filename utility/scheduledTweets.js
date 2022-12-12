const db = require("../utility/postgres");

const ScheduledTweets = {
  getScheduledTweets,
  updateScheduledTweet,
};

async function getScheduledTweets(page = 1, pageSize = 5) {
  const query = `select tweet_id, tweet_caption_text, tweet_scheduled_date, 
                  tweet_base_schedule_date, tweet_created_date, 
                  array_to_json(array_agg(row_to_json(p.*))) AS tweet_posters 
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

  return scheduledTweets?.map((tweet) => ({
    ...tweet,
    tweet_posters: tweet?.tweet_posters?.map((poster) => ({
      ...poster,
      poster_image_path: poster?.poster_image_path?.replace("./public", ""),
      filename: poster?.poster_image_path?.replace(
        new RegExp("[./a-zA-Z0-9]+/", "g"),
        ""
      ),
    })),
  }));
}

async function updateScheduledTweet(id, caption, posterIds) {
  const resultUpdateTweet = await db
    .any(
      `update tweets
    set tweet_caption_text = $1 
    where tweet_id = $2`,
      [caption, id]
    )
    .then(() => "success")
    .catch();

  const resultUpdatePoster = await db
    .any(
      `update posters
      set poster_tweet_id = null
      where poster_tweet_id = $1 
      and not (poster_id = any($2))`,
      [id, posterIds]
    )
    .then(async function () {
      return await db.any(
        `update posters
        set poster_tweet_id = $1 
        where poster_id = any($2)`,
        [id, posterIds]
      )
        .then(() => "success")
        .catch((error) => {
          console.log("Error updating poster 2:", error);
        });
    })
    .catch((error) => {
      console.log("Error updating poster 1:", error);
    });
  
  if (resultUpdateTweet === "success" && resultUpdatePoster === "success") {
    return "update tweet success";
  }
  return "update tweet failed";
}

module.exports = {
  ScheduledTweets,
};
