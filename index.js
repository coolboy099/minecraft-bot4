const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const fetch = require('node-fetch');

const SERVER_IP = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const VERSION = '1.21.6';
let bot = null;

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('🌍 Web server is running!');
});

server.listen(PORT, () => {
  console.log(`🌍 Web server running on port ${PORT}`);
});

function createBot() {
  console.log('✅ Server online, joining bot...');

  bot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: 'BETA12',
    version: VERSION
  });

  bot.on('login', () => {
    console.log('🤖 Bot joined the server!');
    bot.chat('hello!');
  });

  bot.on('spawn', () => {
    setInterval(() => {
      bot.setControlState('forward', true);
      setTimeout(() => {
        bot.setControlState('forward', false);
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
          bot.setControlState('sneak', true);
          setTimeout(() => {
            bot.setControlState('sneak', false);
          }, 1000);
        }, 500);
      }, 2000);
    }, 10000); // 10 sec loop
  });

  bot.on('end', () => {
    console.log('❌ Bot disconnected.');
  });

  bot.on('error', (err) => {
    console.log('❌ Bot Error:', err);
  });
}

async function isServerOnline() {
  try {
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_IP}:${SERVER_PORT}`);
    const data = await response.json();
    return data?.online || false;
  } catch {
    return false;
  }
}

async function checkAndStartBot() {
  const online = await isServerOnline();
  if (online) {
    if (!bot || bot?.player === undefined) {
      createBot();
    } else {
      console.log('ℹ️ Server is online, bot state ok.');
    }
  } else {
    console.log('⚠️ Server offline. Skipping bot join.');
  }
}

// Run check every 2 minutes
checkAndStartBot();
setInterval(checkAndStartBot, 2 * 60 * 1000);
