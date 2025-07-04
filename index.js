const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');

const SERVER_HOST = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
const BOT_SWITCH_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const BOT_USERNAMES = ['BETA3', 'BETA12', 'BETA5', 'BETA9']; // jitne chaho daal lo
let botIndex = 0;
let bot = null;

function createBot(username) {
  bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: username,
    version: '1.21.6'
  });

  bot.on('login', () => {
    console.log(`✅ Bot ${username} logged in.`);
    setTimeout(() => {
      if (bot && bot.chat) bot.chat('Bot ready to help!');
    }, 3000);
  });

  bot.on('spawn', () => {
    setInterval(() => {
      if (bot && bot.isAlive) {
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 1000);
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 1000);
      }
    }, 10000);
  });

  bot.on('end', () => {
    console.log('❌ Bot disconnected.');
  });

  bot.on('error', err => {
    console.log('❌ Bot Error:', err.message);
  });
}

async function checkServerOnline() {
  try {
    const res = await axios.get(`https://api.mcstatus.io/v2/status/java/${SERVER_HOST}:${SERVER_PORT}`);
    const online = res.data.online;
    if (online && !bot) {
      console.log('✅ Server online, joining bot...');
      createBot(BOT_USERNAMES[botIndex]);
    } else if (!online && bot) {
      console.log('🛑 Server offline, disconnecting bot...');
      bot.quit();
      bot = null;
    } else {
      console.log(`ℹ️ Server is ${online ? 'online' : 'offline'}, bot state ok.`);
    }
  } catch (err) {
    console.log('⚠️ Error checking server status:', err.message);
  }
}

// Switch bot every 4 hours
setInterval(() => {
  if (bot) {
    console.log('🔁 Switching bot...');
    bot.quit();
    bot = null;
    botIndex = (botIndex + 1) % BOT_USERNAMES.length;
    createBot(BOT_USERNAMES[botIndex]);
  }
}, BOT_SWITCH_INTERVAL);

// Server check loop
setInterval(checkServerOnline, CHECK_INTERVAL);
checkServerOnline();

// Uptime server
const app = express();
app.get('/', (req, res) => res.send('✅ Bot is running and alive!'));
app.listen(3000, () => console.log('🌍 Web server running on port 3000'));


