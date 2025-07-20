const mineflayer = require('mineflayer');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

const SERVER_IP = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const VERSION = '1.21.1';
const BOT_PREFIX = 'BETA';
const BOT_START = 3;
const BOT_END = 20;
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
const SWITCH_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

let botNumber = BOT_START;
let bot;
let switchTimer;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(3000, () => console.log('Web server started'));

function getNextBotName() {
  const name = `${BOT_PREFIX}${botNumber}`;
  botNumber = botNumber < BOT_END ? botNumber + 1 : BOT_START;
  return name;
}

async function isServerOnline() {
  try {
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_IP}:${SERVER_PORT}`);
    const data = await res.json();
    return data.online;
  } catch {
    return false;
  }
}

function startBot(botName) {
  const newBot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: botName,
    version: VERSION,
  });

  newBot.on('login', () => {
    console.log(`✅ Bot ${botName} logged in.`);
    newBot.chat('/login 1234');
    setTimeout(() => newBot.chat('/register 1234 1234'), 5000);
    randomMovement(newBot);
  });

  newBot.on('end', () => {
    console.log(`❌ Bot ${botName} disconnected.`);
  });

  newBot.on('kicked', (reason) => {
    console.log(`⛔ Bot ${botName} was kicked:`, reason);
    setTimeout(connectNextBot, 3000);
  });

  newBot.on('error', (err) => {
    console.log(`⚠️ Error with bot ${botName}:`, err.message);
  });

  return newBot;
}

function randomMovement(bot) {
  const actions = ['forward', 'back', 'left', 'right'];
  setInterval(() => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    bot.setControlState(action, true);
    setTimeout(() => bot.setControlState(action, false), 1000);
    bot.setControlState('jump', Math.random() < 0.5);
    bot.setControlState('sneak', Math.random() < 0.3);
  }, 5000);
}

async function connectNextBot() {
  if (bot) bot.quit();
  const online = await isServerOnline();
  if (online) {
    const newName = getNextBotName();
    console.log(`🔁 Trying to connect bot: ${newName}`);
    bot = startBot(newName);
  } else {
    console.log(`❌ Server offline. Retrying in 2 minutes...`);
  }
}

async function startMonitor() {
  setInterval(async () => {
    if (!bot || !bot.player) {
      const online = await isServerOnline();
      if (online) {
        const name = getNextBotName();
        bot = startBot(name);
      }
    }
  }, CHECK_INTERVAL);
}

function startBotSwitchTimer() {
  switchTimer = setInterval(() => {
    console.log('🔄 4 hours passed. Switching bot...');
    connectNextBot();
  }, SWITCH_INTERVAL);
}
