require("dotenv").config();
const { type } = require("express/lib/response");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const nc = require("nextcloud-node-client");
const e = require("express");
let cron = require("node-cron");
let moment = require("moment");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/radl/, (msg, match) => {
  // Gets shifts from nextcloud and sends them to komag chat
  sendShifts();
});

bot.onText(/\/getchatid/, (msg, match) => {
  // sends id of current chat
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, chatId);
});

/**
 *
 * @param {Date} day
 * @returns Object containing the shifts, fetched from nextcloud
 */
async function getShifts(day = new Date()) {
  // construct nextcloud client with credentials from .env
  const client = new nc.Client();

  // get the file with shifts from path from .env
  const file = await client.getFile(process.env.RADL_FILEPATH);

  // split data into array by rows of csv file (one day per row)
  const foo = await file.getContent();
  arr = foo.toString().split("\n");

  // transform rows into objecty using the colum titles from csv header
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

  // format (todays) date to string for comparison
  let datestr = moment().format("DD.MM.YYYY");

  // find todays shifts and return them
  for (let i = 0; i < jsonObj.length - 1; i++) {
    console.log("\n checking:");
    console.log(jsonObj[i]["Datum"].trim());
    console.log(datestr);
    if (jsonObj[i]["Datum"].trim() == datestr) {
      return jsonObj[i];
    }
  }
  return null;
}

let sendShifts = (chatId = process.env.KOMAG_CHAT_ID) => {
  // response title
  let resp = "🗣 Community Management 🤦\n\nHeute dran sind:";

  // get shifts form nextcloud
  getShifts().then((shifts) => {
    // if shifts can be fetched AND there is an entry for today
    if (shifts) {
      // get todays shifts (marked with 'x', e.g. "Manu": 'x')
      let p = Object.keys(shifts).filter((key) => shifts[key] == "x");

      // concat todays shifts to respones
      for (let i = 0; i < p.length; i++) {
        resp += `${i == p.length - 1 ? " und" : ""} ${p[i]}`;
      }

      // send response
      bot.sendMessage(chatId, resp);
    } else {
      // shifts can't be feched OR there is no entry for today
      bot.sendMessage(
        chatId,
        "Kein Eintrag fürs heutige Community Management gefunden :("
      );
    }
  });
};

// cron job to send shifts everyday at 8 am
cron.schedule(
  "0 8 * * *",
  () => {
    console.log("Sent Radl at 8:00 am");
    sendShifts();
  },
  {
    scheduled: true,
    timezone: "Europe/Vienna",
  }
);
