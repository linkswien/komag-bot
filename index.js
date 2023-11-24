require("dotenv").config();
const { type } = require("express/lib/response");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const nc = require("nextcloud-node-client");
const e = require("express");
var cron = require("node-cron");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "/echo [whatever]"
/* bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, chatId);
  bot.sendMessage(chatId, resp);
}); */

bot.onText(/\/radl/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;

  let resp = "KomAG Community Management Radl \n";

  sendShifts();
});

bot.onText(/\/getchatid/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, chatId);
});

async function getShifts(day = new Date()) {
  const client = new nc.Client();

  const file = await client.getFile(process.env.RADL_FILEPATH);

  const foo = await file.getContent();

  arr = foo.toString().split("\n");

  var jsonObj = [];
  var headers = arr[0].split(",");
  for (var i = 1; i < arr.length; i++) {
    var data = arr[i].split(",");
    var obj = {};
    for (var j = 0; j < data.length; j++) {
      obj[headers[j].trim()] = data[j].trim();
    }
    jsonObj.push(obj);
  }

  let datestr = day.toLocaleDateString("de-DE").replaceAll("/", ".");

  for (let i = 0; i < jsonObj.length - 1; i++) {
    if (jsonObj[i]["Datum"].trim() == datestr) {
      return jsonObj[i];
    }
  }
}

let sendShifts = (chatId = process.env.KOMAG_CHAT_ID) => {
  let resp = "🗣 Community Management 🤦\n\nHeute dran sind:";

  getShifts().then((shifts) => {
    if (shifts) {
      let p = Object.keys(shifts).filter((key) => shifts[key] == "x");

      for (let i = 0; i < p.length; i++) {
        resp += `${i == p.length - 1 ? " und" : ""} ${p[i]}`;
      }
      bot.sendMessage(chatId, resp);
    } else {
      bot.sendMessage(
        chatId,
        "Kein Eintrag fürs heutige Community Management gefunden :("
      );
    }
  });
};

cron.schedule(
  "0 8 * * *",
  () => {
    console.log("Sent Radl at 8:00");
    sendShifts();
  },
  {
    scheduled: true,
    timezone: "Europe/Vienna",
  }
);
