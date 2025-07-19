const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3').Vec3;
const mc = require('minecraft-protocol');
const axios = require('axios');

let bot;
let botIndex = 3;
let currentBot = null;
let reconnectInterval;
const maxBots = 20;

function createBot() {
  const username = `BETA${botIndex}`;
  console.log(`🟢 Trying bot: ${username}`);

  bot = mineflayer.createBot({
    host: 'dttyagi-lol10110.aternos.me',
    port: 40234,
    username: username,
    version: false
  });

  bot.loadPlugin(pathfinder);

  bot.on('spawn', () => {
    console.log(`✅ ${username} joined successfully!`);

    // Auto Login/Register for Authoriseme
    bot.chat('/register 123456 123456');
    setTimeout(() => bot.chat('/login 123456'), 3000);

    // Random movement
    setInterval(() => {
      const movements = [() => bot.setControlState('forward', true),
                         () => bot.setControlState('jump', true),
                         () => bot.setControlState('sneak', true)];
      const action = movements[Math.floor(Math.random() * movements.length)];
      action();
      setTimeout(() => {
        bot.clearControlStates();
      }, 2000);
    }, 10000); // move every 10 sec
  });

  bot.on('kicked', (reason) => {
    console.log(`❌ Bot kicked: ${reason}`);
    nextBot();
  });

  bot.on('end', () => {
    console.log(`❌ Bot disconnected.`);
  });

  bot.on('error', (err) => {
    console.log(`❌ Bot Error: ${err}`);
    nextBot();
  });
}

function nextBot() {
  if (botIndex < maxBots) {
    botIndex++;
    setTimeout(createBot, 5000);
  } else {
    console.log("🚫 All bot usernames used.");
  }
}

// Server check every 2 minutes
async function checkServer() {
  try {
    const response = await axios.get('https://api.mcstatus.io/v2/status/java/dttyagi-lol10110.aternos.me:40234');
    if (response.data.online) {
      console.log("✅ Server online, joining bot...");
      if (!bot || bot?.player?.uuid == null) {
        createBot();
      } else {
        console.log("ℹ️ Server is online, bot state ok.");
      }
    } else {
      console.log("🔴 Server offline.");
    }
  } catch (error) {
    console.log("❌ Server check error: " + error.message);
  }
}

// Start checking
checkServer();
reconnectInterval = setInterval(checkServer, 2 * 60 * 1000);

