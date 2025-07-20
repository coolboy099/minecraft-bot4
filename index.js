const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const fetch = require('node-fetch');

const SERVER_HOST = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const VERSION = '1.21.6';

const BOT_NAMES = Array.from({ length: 18 }, (_, i) => `BETA${i + 3}`);
let currentBotIndex = 0;
let bot;
let switchTimer;
let onlineCheckInterval;

const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
http.createServer(app).listen(3000);

function createBot() {
  const username = BOT_NAMES[currentBotIndex];
  console.log(`⛏️ Starting bot: ${username}`);

  bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username,
    version: VERSION,
  });

  bot.on('login', () => {
    console.log(`✅ Logged in as ${bot.username}`);
    autoRespawn();
    randomMovement();
  });

  bot.on('end', () => {
    console.log('⚠️ Bot disconnected. Retrying in 10s...');
    clearInterval(onlineCheckInterval);
    setTimeout(startIfOnline, 10000);
  });

  bot.on('kicked', (reason) => {
    console.log(`❌ Kicked: ${reason}`);
    tryNextBot();
  });

  bot.on('error', (err) => {
    console.log(`❌ Error: ${err.message}`);
  });
}

function autoRespawn() {
  bot.on('death', () => {
    console.log('☠️ Bot died. Respawning...');
    setTimeout(() => {
      if (bot && bot.isAlive === false) bot.respawn();
    }, 5000);
  });
}

function randomMovement() {
  setInterval(() => {
    if (!bot || !bot.entity) return;

    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'jump') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    } else if (action === 'sneak') {
      bot.setControlState('sneak', true);
      setTimeout(() => bot.setControlState('sneak', false), 1000);
    } else {
      bot.setControlState(action, true);
      setTimeout(() => bot.setControlState(action, false), 1000);
    }
  }, 7000);
}

function tryNextBot() {
  currentBotIndex = (currentBotIndex + 1) % BOT_NAMES.length;
  createBot();
}

function switchBot() {
  console.log('⏳ Switching bot...');
  const nextIndex = (currentBotIndex + 1) % BOT_NAMES.length;
  const nextName = BOT_NAMES[nextIndex];

  const newBot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: nextName,
    version: VERSION,
  });

  newBot.on('login', () => {
    console.log(`🔁 Switched to ${nextName}`);
    if (bot) bot.quit('Switching bot');
    bot = newBot;
    currentBotIndex = nextIndex;
    autoRespawn();
    randomMovement();
  });

  newBot.on('kicked', () => {
    console.log(`❌ ${nextName} got kicked. Trying next.`);
    newBot.quit();
    currentBotIndex = nextIndex;
    switchBot();
  });

  newBot.on('error', (err) => {
    console.log(`❌ Switch error: ${err.message}`);
  });
}

function checkServerOnline() {
  fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_HOST}:${SERVER_PORT}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.online) {
        if (!bot || !bot.username) {
          console.log('🟢 Server is online. Starting bot...');
          createBot();
        }
      } else {
        console.log('🔴 Server is offline.');
      }
    })
    .catch(err => {
      console.log(`❌ Server check failed: ${err.message}`);
    });
}

function startIfOnline() {
  checkServerOnline();
  onlineCheckInterval = setInterval(checkServerOnline, 2 * 60 * 1000); // 2 minutes
  switchTimer = setInterval(switchBot, 4 * 60 * 60 * 1000); // 4 hours
}

startIfOnline();



