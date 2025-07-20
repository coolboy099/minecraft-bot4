const mineflayer = require('mineflayer');
const { Client } = require('minecraft-protocol');
const express = require('express');
const app = express();

const SERVER_HOST = "dttyagi-lol10110.aternos.me";
const SERVER_PORT = 40234;

const START_BOT_INDEX = 12; // BETA12 se start
const MAX_BOT_INDEX = 20;

let currentBot = null;
let currentIndex = START_BOT_INDEX;
let reconnectTimer = null;

function createBot(botName) {
  console.log(`🟢 Trying bot: ${botName}`);

  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: botName,
    version: "1.21.1"
  });

  bot.once('login', () => {
    console.log(`✅ Bot ${botName} logged in.`);
    currentBot = bot;
    setupBot(bot);
  });

  bot.on('end', () => {
    console.log("🔁 Bot disconnected. Retrying in 5 seconds...");
    currentBot = null;
    setTimeout(connectNextBot, 5000);
  });

  bot.on('error', (err) => {
    console.log("❌ Bot error:", err.message);
  });
}

function connectNextBot() {
  currentIndex++;
  if (currentIndex > MAX_BOT_INDEX) {
    console.log("🚫 No more usernames left.");
    return;
  }
  const nextName = `BETA${currentIndex}`;
  createBot(nextName);
}

function setupBot(bot) {
  // Auto register/login
  bot.once('spawn', () => {
    setTimeout(() => bot.chat('/register 123456 123456'), 2000);
    setTimeout(() => bot.chat('/login 123456'), 4000);
    setTimeout(() => startMovement(bot), 7000);
    setAutoRespawn(bot);
  });

  // Auto switch bot after 4 hours
  setTimeout(() => {
    const nextName = `BETA${currentIndex + 1}`;
    console.log(`⏰ 4 hours passed. Switching to ${nextName}`);
    createBot(nextName);
    if (currentBot) currentBot.quit();
  }, 4 * 60 * 60 * 1000);
}

function startMovement(bot) {
  if (!bot || !bot.entity) return;

  const movements = ['forward', 'back', 'left', 'right'];
  let moveIndex = 0;

  setInterval(() => {
    if (!bot.entity) return;
    const dir = movements[moveIndex % movements.length];
    bot.setControlState(dir, true);
    setTimeout(() => bot.setControlState(dir, false), 1000);
    moveIndex++;
  }, 4000);

  setInterval(() => {
    if (!bot.entity) return;
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
  }, 8000);

  setInterval(() => {
    if (!bot.entity) return;
    bot.setControlState('sneak', true);
    setTimeout(() => bot.setControlState('sneak', false), 1000);
  }, 12000);
}

function setAutoRespawn(bot) {
  bot.on('death', () => {
    setTimeout(() => bot.emit('respawn'), 2000);
  });
}

// Server check every 2 min
setInterval(() => {
  const client = Client({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: 'PingChecker',
    version: '1.21.6'
  });

  client.on('connect', () => {
    console.log("ℹ️ Server is online, bot state ok.");
    client.end();
  });

  client.on('error', () => {
    console.log("⚠️ Server offline or not responding.");
  });
}, 2 * 60 * 1000);

// Web server for Render ping
app.get("/", (req, res) => {
  res.send("✅ Bot is running!");
});
app.listen(3000, () => {
  console.log("🌐 Web server running on port 3000");
});

// Start first bot
createBot(`BETA${currentIndex}`);


