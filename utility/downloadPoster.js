const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { readFileSync } = require("fs");
const input = require("input");
const fs = require("fs-extra");

require("dotenv").config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
let session;
try {
  session = readFileSync("./session/app.session", {
    encoding: "utf8",
    flag: "r",
  });
} catch (e) {
  console.log(e?.message);
}
const stringSession = new StringSession(session);

async function downloadPoster(startDateString, endDateString) {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  try {
    await client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => {
        throw err;
      },
    });
  } catch (err) {
    return err;
  }

  if (!session) {
    fs.outputFile(`./session/app.session`, client.session.save(), (err) =>
      err ? console.log(err) : ""
    );
  }

  const startDate =
    new Date(startDateString).setHours(0, 0, 0, 0).valueOf() / 1000;
  const endDateTemp = new Date(endDateString);
  const endDate =
    new Date(endDateTemp.setDate(endDateTemp.getDate() + 1))
      .setHours(0, 0, 0, 0)
      .valueOf() / 1000;

  const BASE_PATH = './public/media';

  try {
    for await (const message of client.iterMessages(
      parseInt(process.env.TELEGRAM_GROUP_CHAT_ID),
      {
        reverse: true,
        offsetDate: startDate,
      }
    )) {
      if (message?.date > endDate) {
        break;
      }
      if (message?.media?.photo) {
        const buffer = await client.downloadMedia(message.media, {});
        let filePath;
        if (message.groupedId) {
          filePath = `${BASE_PATH}/${message.groupedId}/photo_${message.media.photo.id}.jpg`;
        } else {
          filePath = `${BASE_PATH}/photo_${message.media.photo.id}.jpg`;
        }
        fs.outputFile(filePath, buffer, (err) => (err ? console.log(err) : ""));
      }
    }
  } catch (err) {
    return err;
  }

  return "download poster success";
}

module.exports = downloadPoster;
