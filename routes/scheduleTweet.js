var express = require("express");
const db = require("../utility/postgres");
var router = express.Router();
const fs = require("fs");
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
  const query = `SELECT * FROM posters WHERE poster_id = '${lastImageId}' LIMIT 1`;
  const poster = await db
    .one(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get next poster:", error);
    });

  const file = fs.readFileSync(poster.poster_image_path, { encoding: "utf8" });
  return {
    poster_id: poster.poster_id,
    poster_image_path: poster.poster_image_path,
    poster_message_date: poster.poster_message_date,
    poster_created_date: poster.poster_created_date,
    poster_file: file,
  };
}

function isPosterValid(poster) {
  return true;
}

function getSchedule(lastPostedDate) {
  var hour = lastPostedDate.getHours();
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
  }
}

function getCaption() {
  return "sample caption";
}

async function schedulePostTweet(poster, caption, postDateTime) {
  return await db
    .none(
      "insert into tweets(tweet_poster_id, tweet_caption_text, tweet_scheduled_date) VALUES($1, $2, $3)" + 
      " on conflict(tweet_poster_id) do nothing",
      [poster, caption, postDateTime]
    )
    .then(() => {
      return "success";
    })
    .catch((error) => {
      console.log("Error schedule tweet:", error);
    });
}

function updateLastPostedDate() {
  return "success";
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
  let startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  const checkpoint = await getTweetsCheckpoint();

  // get lastPostedDate & get lastImage
  let lastPostedDate = new Date(checkpoint.tweet_checkpoint_last_posted_date);
  let lastImageId = checkpoint.tweet_checkpoint_last_posted_image;
  let successCount = 0;

  const tweetsNeeded = countTweetsNeeded(startDate, endDate);
  for (let i = 0; i < tweetsNeeded; i++) {
    const poster = await getNextPoster(lastImageId);
    if (!poster) {
      break;
    }
    if (!isPosterValid(poster)) {
      continue;
    }
    const schedule = getSchedule(lastPostedDate);
    const caption = getCaption(poster);
    const result = await schedulePostTweet(poster.poster_id, caption, schedule);
    if (result === "success") {
      lastPostedDate = schedule;
      lastImageId = poster.poster_id;
      successCount++;
    }
  }

  updateLastPostedDate(lastPostedDate, lastImageId);

  return {
    message: successCount > 0 ? "schedule tweet success" : "schedule tweet failed",
    successCount: successCount,
    lastPostedDate: lastPostedDate,
  };
}

/* Post a Tweet Schedule. */
router.post("/", async function (req, res, next) {
  const result = await scheduleTweet(req.body.startDate, req.body.endDate);
  res.send(result);
});

module.exports = router;
