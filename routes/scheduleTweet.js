var express = require("express");
const pgp = require("pg-promise")();
const db = require("../utility/postgres");
var router = express.Router();
const { differenceInCalendarDays, differenceInMinutes } = require("date-fns");
const { ScheduledTweets } = require("../utility/scheduledTweets");

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

async function getPostersWithSameGroup(group) {
  const query = `select * from posters where poster_group = '${group}'`;

  const posters = await db
    .many(query)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log("Error get next poster:", error);
    });

  return posters;
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

function getScheduleFromStartDate(startDate) {
  let times = [];
  if (POST_PER_DAY === 3) {
    times = [8, 12, 17];
  } else if (POST_PER_DAY === 4) {
    times = [8, 12, 16, 18];
  }
  if (times.length === 0) {
    return null;
  }
  const closestHour = times.find((time) => {
    let currentDate = new Date(startDate.getTime());
    currentDate.setHours(time, 0, 0);
    const diff = differenceInMinutes(currentDate, startDate);
    return diff >= 0;
  });
  let schedule = new Date(startDate.getTime());
  if (!closestHour) {
    schedule.setDate(schedule.getDate() + 1);
    schedule.setHours(
      times[0],
      randomIntFromInterval(1, 10),
      randomIntFromInterval(1, 10)
    );
  } else {
    schedule.setHours(
      closestHour,
      randomIntFromInterval(1, 10),
      randomIntFromInterval(1, 10)
    );
  }
  return schedule;
}

function getCaption(poster, group = false) {
  return "sample caption";
}

async function schedulePostTweet(poster, caption, postDateTime, baseDate) {
  const result = await db
    .oneOrNone(
      `insert into tweets(tweet_caption_text, tweet_scheduled_date, tweet_base_schedule_date) 
        VALUES($1, $2, $3) ON CONFLICT(tweet_base_schedule_date) DO NOTHING RETURNING tweet_id`,
      [caption, postDateTime, baseDate]
    )
    .then(async (tweet) => {
      if (!tweet) return null;
      return await db
        .none("UPDATE posters SET poster_tweet_id = $1 WHERE poster_id = $2", [
          tweet?.tweet_id,
          poster,
        ])
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
    .then(() => null)
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
  let lastImageId = checkpoint.tweet_checkpoint_last_posted_image;

  const tweetsNeeded = countTweetsNeeded(startDate, endDate);
  let successCount = 0;

  let startScheduleDate = new Date(startDate.getTime());
  let endScheduleDate = new Date(endDate.getTime());
  endScheduleDate.setHours(endScheduleDate.getHours() + 1);

  let poster;
  for (let i = 0; i < tweetsNeeded; i++) {
    poster = await getNextPoster(lastImageId);
    if (!poster) {
      console.log("Poster not found");
      break;
    }
    if (poster.poster_group) {
      const posters = await getPostersWithSameGroup(poster.poster_group);
      let schedule = getScheduleFromStartDate(startScheduleDate);
      if (schedule > endScheduleDate) {
        console.log("Reached the end of schedule");
        break;
      }
      let successChunk = 0;
      const chunkSize = 4;
      for (let j = 0; j < posters.length; j += chunkSize) {
        schedule.setMinutes(schedule.getMinutes() + j);
        const chunkPosters = posters.slice(j, j + chunkSize);
        const caption = getCaption(posters, true);
        let baseDate = new Date(schedule.getTime());
        baseDate.setHours(schedule.getHours(), j, 0);
        const tweet = await db
          .oneOrNone(
            `insert into tweets(tweet_caption_text, tweet_scheduled_date, tweet_base_schedule_date) 
              VALUES($1, $2, $3) ON CONFLICT(tweet_base_schedule_date) DO NOTHING RETURNING tweet_id`,
            [caption, schedule, baseDate]
          )
          .then((tweet) => tweet)
          .catch((error) => {
            console.log("Error schedule tweet (table tweet):", error);
          });
        if (!tweet) {
          if (i + 1 < tweetsNeeded) {
            startScheduleDate = new Date(schedule.getTime());
            startScheduleDate.setHours(schedule.getHours() + 1);
          }
          continue;
        }

        for (let k = 0; k < chunkPosters.length; k++) {
          if (!isPosterValid(chunkPosters[k])) {
            continue;
          }
          const result = await db
            .none(
              "UPDATE posters SET poster_tweet_id = $1 WHERE poster_id = $2",
              [tweet?.tweet_id, chunkPosters[k]?.poster_id]
            )
            .then(() => {
              return "success";
            })
            .catch((error) => {
              console.log("Error schedule tweet (table poster):", error);
            });
          if (result === "success") {
            successChunk++;
          }
        }
      }
      if (successChunk === posters.length) {
        lastImageId = posters[posters.length - 1].poster_id;
        successCount++;
      }
      if (i + 1 < tweetsNeeded) {
        startScheduleDate = new Date(schedule.getTime());
        startScheduleDate.setHours(schedule.getHours() + 1);
      }
    } else {
      if (!isPosterValid(poster)) {
        continue;
      }
      const schedule = getScheduleFromStartDate(startScheduleDate);
      if (schedule > endScheduleDate) {
        console.log("Reached the end of schedule");
        break;
      }
      const caption = getCaption(poster);
      let baseDate = new Date(schedule.getTime());
      baseDate.setHours(schedule.getHours(), 0, 0);
      const result = await schedulePostTweet(
        poster.poster_id,
        caption,
        schedule,
        baseDate
      );
      if (result === "success") {
        lastImageId = poster.poster_id;
        successCount++;
      }
      if (i + 1 < tweetsNeeded) {
        startScheduleDate = new Date(schedule.getTime());
        startScheduleDate.setHours(schedule.getHours() + 1);
      }
    }
    poster = null;
  }

  await updateCheckpoint(
    checkpoint.tweet_checkpoint_id,
    lastImageId,
    startScheduleDate
  );

  return {
    message:
      successCount > 0 ? "schedule tweet success" : "schedule tweet failed",
    successCount: successCount,
    tweetsNeeded: tweetsNeeded,
    lastPostedDate: startScheduleDate,
  };
}

/* Post a Tweet Schedule. */
router.post("/", async function (req, res, next) {
  const result = await scheduleTweet(req.body.startDate, req.body.endDate);
  res.send(result);
});

/* Post a Tweet Schedule. */
router.get("/", async function (req, res, next) {
  const scheduledTweets = await ScheduledTweets.getScheduledTweets();
  res.send(scheduledTweets);
});

module.exports = router;
