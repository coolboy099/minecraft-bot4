// 📦 Required Libraries
const mineflayer = require('mineflayer');
const http = require('http');
const util = require('util');
const dns = require('dns');

// 🌐 Server Info
const SERVER_IP = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const VERSION = '1.21.1';
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

// 🤖 Bot Usernames
const usernames = ['BETA12', 'BETA13', 'BETA14', 'BETA15', 'BETA16'];
let currentBotIndex = 0;
let bot = null;

// 🌍 Web server for uptime
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive');
}).listen(3000);

// 🔁 Create bot
function createBot() {
  if (currentBotIndex >= usernames.length) {
    console.log('🚫 No more usernames left.');
    return;
  }

  const username = usernames[currentBotIndex];
  console.log(`🟢 Trying bot: ${username}`);

  bot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username,
    version: VERSION
  });

  bot.on('login', () => {
    console.log(`✅ Bot ${username} logged in.`);

    // 🔐 Auto register & login
    bot.once('spawn', () => {
      bot.chat('/register 123456 123456');
      setTimeout(() => {
        bot.chat('/login 123456');
      }, 3000);
    });

    startMovement();
  });

  bot.on('end', () => {
    console.log('🔁 Bot disconnected. Retrying in 5 seconds...');
    setTimeout(() => {
      currentBotIndex++;
      createBot();
    }, 5000);
  });

  bot.on('error', (err) => {
    console.log('❌ Bot error:', err.message);
  });
}

// 🕹️ Basic movement
function startMovement() {
  if (!bot) return;
  const movements = ['forward', 'back', 'left', 'right'];
  let moveIndex = 0;

  setInterval(() => {
    const dir = movements[moveIndex % movements.length];
    bot.setControlState(dir, true);
    setTimeout(() => bot.setControlState(dir, false), 1000);
    moveIndex++;
  }, 4000);

  setInterval(() => {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
  }, 7000);

  setInterval(() => {
    bot.setControlState('sneak', true);
    setTimeout(() => bot.setControlState('sneak', false), 1000);
  }, 10000);
}

// 🌐 Check if server is online
function checkServerOnline(callback) {
  dns.lookup(SERVER_IP, (err) => {
    callback(!err);
  });
}

// ⏲️ Periodic check
setInterval(() => {
  checkServerOnline((online) => {
    if (online && (!bot || !bot.player)) {
      console.log('✅ Server online, joining bot...');
      createBot();
    } else if (!online) {
      console.log('🔴 Server is offline');
    } else {
      console.log('ℹ️ Server is online, bot state ok.');
    }
  });
}, CHECK_INTERVAL);

// 🚀 Initial check
checkServerOnline((online) => {
  if (online) {
    console.log('✅ Server online, joining bot...');
    createBot();
  } else {
    console.log('🔴 Server offline at startup');
  }
});

