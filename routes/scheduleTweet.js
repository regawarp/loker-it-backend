var express = require("express");
const pgp = require("pg-promise")();
const db = require("../utility/postgres");
var router = express.Router();
const { differenceInCalendarDays } = require("date-fns");

const POST_PER_DAY = 3;

function sameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getDaysBetween(startDate, endDate) {
  return differenceInCalendarDays(endDate, startDate) + 1;
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function countTweetsNeeded(startDate, endDate) {
  let count = 0;
  if (sameDay(startDate, endDate)) {
    let times = [];
    if (POST_PER_DAY === 3) {
      times = ["08:00:00", "12:00:00", "17:00:00"];
    } else if (POST_PER_DAY === 4) {
      times = ["08:00:00", "12:00:00", "17:00:00", "18:30:00"];
    }
    for (let i = 0; i < times.length; i++) {
      let time = new Date(startDate.getTime());
      time.setHours(times[i].split(":")[0]);
      time.setMinutes(times[i].split(":")[1]);
      time.setSeconds(times[i].split(":")[2]);

      if (startDate <= time && endDate >= time) {
        count++;
      }
    }
    return count;
  }

  const daysBetween = getDaysBetween(startDate, endDate);
  if (daysBetween > 2) {
    count = POST_PER_DAY * (daysBetween - 2);
  }
  let times = [];
  if (POST_PER_DAY === 3) {
    times = ["08:00:00", "12:00:00", "17:00:00"];
  } else if (POST_PER_DAY === 4) {
    times = ["08:00:00", "12:00:00", "17:00:00", "18:30:00"];
  }
  for (let i = 0; i < times.length; i++) {
    let time = new Date(startDate.getTime());
    time.setHours(times[i].split(":")[0]);
    time.setMinutes(times[i].split(":")[1]);
    time.setSeconds(times[i].split(":")[2]);

    if (startDate <= time && endDate >= time) {
      count++;
    }
  }
  for (let i = 0; i < times.length; i++) {
    let time = new Date(endDate.getTime());
    time.setHours(times[i].split(":")[0]);
    time.setMinutes(times[i].split(":")[1]);
    time.setSeconds(times[i].split(":")[2]);

    if (startDate <= time && endDate >= time) {
      count++;
    }
  }
  return count;
}

async function getNextPoster(lastImageId) {
  const query =
    lastImageId && lastImageId !== ""
      ? `SELECT d1.* FROM
                  (SELECT Row_Number() over (order by poster_message_date) AS RowIndex, * from posters) AS d1 
                  INNER JOIN 
                  (SELECT Row_Number() over (order by poster_message_date) AS RowIndex, * from posters) AS d2 
                  ON (d2.poster_id  = '${lastImageId}' and d1.RowIndex > d2.RowIndex) 
                  limit 1`
      : "select * from posters p order by poster_message_date limit 1";

  const poster = await db
    .one(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get next poster:", error);
    });

  return poster;
}

function isPosterValid(poster) {
  return true;
}

function getSchedule(lastPostedDate, startDate) {
  const hour = lastPostedDate.getHours();
  if (hour === 8) {
    lastPostedDate.setHours(
      12,
      randomIntFromInterval(1, 10),
      randomIntFromInterval(1, 10),
      0
    );
    return lastPostedDate;
  }
  if (POST_PER_DAY === 3) {
    if (hour === 12) {
      lastPostedDate.setHours(
        17,
        randomIntFromInterval(1, 10),
        randomIntFromInterval(1, 10),
        0
      );
      return lastPostedDate;
    }
    if (hour === 17) {
      lastPostedDate.setDate(lastPostedDate.getDate() + 1);
      lastPostedDate.setHours(
        8,
        randomIntFromInterval(1, 10),
        randomIntFromInterval(1, 10),
        0
      );
      return lastPostedDate;
    }
  } else if (POST_PER_DAY === 4) {
    if (hour === 12) {
      lastPostedDate.setHours(
        16,
        randomIntFromInterval(1, 10),
        randomIntFromInterval(1, 10),
        0
      );
      return lastPostedDate;
    }
    if (hour === 16) {
      lastPostedDate.setHours(
        18,
        30 + randomIntFromInterval(1, 10),
        randomIntFromInterval(1, 10),
        0
      );
      return lastPostedDate;
    }
    if (hour === 18) {
      lastPostedDate.setDate(lastPostedDate.getDate() + 1);
      lastPostedDate.setHours(
        8,
        randomIntFromInterval(1, 10),
        randomIntFromInterval(1, 10),
        0
      );
      return lastPostedDate;
    }
  }

  startDate.setHours(
    8,
    randomIntFromInterval(1, 10),
    randomIntFromInterval(1, 10),
    0
  );
  return startDate;
}

function getCaption() {
  return "sample caption";
}

async function schedulePostTweet(poster, caption, postDateTime) {
  const result = await db
    .one(
      "insert into tweets(tweet_caption_text, tweet_scheduled_date) VALUES($1, $2) RETURNING tweet_id",
      [caption, postDateTime]
    )
    .then(async (tweet) => {
      return await db
        .none(
          "UPDATE posters SET poster_tweet_id = $1 WHERE poster_id = $2",
          [tweet?.tweet_id, poster]
        )
        .then(() => {
          return "success";
        })
        .catch((error) => {
          console.log("Error schedule tweet (table poster):", error);
        });
    })
    .catch((error) => {
      console.log("Error schedule tweet (table tweet):", error);
    });
  return result;
}

async function updateCheckpoint(id, lastImageId, lastPostedDate) {
  const query = pgp.helpers.update(
    {
      tweet_checkpoint_id: id,
      tweet_checkpoint_last_posted_image: lastImageId,
      tweet_checkpoint_last_posted_date: lastPostedDate,
    },
    null,
    "tweets_checkpoint"
  );
  db.none(query)
    .then(() => {
      console.log("Update checkpoint success");
    })
    .catch((error) => {
      console.log("Error updating checkpoint:", error);
    });
}

async function getTweetsCheckpoint() {
  const query = "SELECT * FROM tweets_checkpoint LIMIT 1";
  return await db
    .one(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get tweets checkpoint:", error);
    });
}

/* Schedule a Tweet */
async function scheduleTweet(startDateString, endDateString) {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  const checkpoint = await getTweetsCheckpoint();
  let lastPostedDate = checkpoint.tweet_checkpoint_last_posted_date
    ? new Date(checkpoint.tweet_checkpoint_last_posted_date)
    : startDate;
  let lastImageId = checkpoint.tweet_checkpoint_last_posted_image;

  const tweetsNeeded = countTweetsNeeded(startDate, endDate);
  let successCount = 0;

  let endScheduleDate = endDate;
  endScheduleDate.setHours(endScheduleDate.getHours() + 1);

  for (let i = 0; i < tweetsNeeded; i++) {
    const poster = await getNextPoster(lastImageId);
    if (!poster) {
      break;
    }
    if (!isPosterValid(poster)) {
      continue;
    }
    const schedule = getSchedule(lastPostedDate, startDate);
    if (schedule > endScheduleDate) {
      break;
    }
    const caption = getCaption(poster);
    const result = await schedulePostTweet(poster.poster_id, caption, schedule);
    if (result === "success") {
      lastPostedDate = schedule;
      lastImageId = poster.poster_id;
      successCount++;
    }
  }

  await updateCheckpoint(
    checkpoint.tweet_checkpoint_id,
    lastImageId,
    lastPostedDate
  );

  return {
    message:
      successCount === tweetsNeeded
        ? "schedule tweet success"
        : "schedule tweet failed",
    successCount: successCount,
    tweetsNeeded: tweetsNeeded,
    lastPostedDate: lastPostedDate,
  };
}

/* Post a Tweet Schedule. */
router.post("/", async function (req, res, next) {
  const result = await scheduleTweet(req.body.startDate, req.body.endDate);
  res.send(result);
});

module.exports = router;
