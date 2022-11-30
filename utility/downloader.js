const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { readFileSync } = require("fs");
const input = require("input");
const fs = require("fs-extra");

require('dotenv').config()

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

async function downloadPoster() {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  if (!session) {
    fs.outputFile(`./session/app.session`, client.session.save(), (err) =>
      err ? console.log(err) : ""
    );
  }

  const startDate = new Date("2022/11/23").valueOf() / 1000;
  const endDate = new Date("2022/11/30").valueOf() / 1000;

  for await (const message of client.iterMessages(parseInt(process.env.TELEGRAM_GROUP_CHAT_ID), {
    reverse: true,
    offsetDate: startDate,
  })) {
    if (message?.date > endDate) {
      break;
    }
    if (message?.media?.photo) {
      if (message.groupedId) {
        const buffer = await client.downloadMedia(message.media, {});
        fs.outputFile(
          `./media/${message.groupedId}/photo_${message.media.photo.id}.jpg`,
          buffer,
          (err) => (err ? console.log(err) : "")
        );
      } else {
        const buffer = await client.downloadMedia(message.media, {});
        fs.outputFile(
          `./media/photo_${message.media.photo.id}.jpg`,
          buffer,
          (err) => (err ? console.log(err) : "")
        );
      }
    }
  }
  return "download poster success";
}

module.exports = downloadPoster;
