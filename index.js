const mineflayer = require('mineflayer');
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

let bot;
const username = 'BETA12'; // Apna bot username yahan daalein
const serverHost = 'dttyagi-lol10110.aternos.me';
const serverPort = 40234;
const mcVersion = '1.21.6'; // Apne server ki correct version yahan daalein

// Function to create bot
function createBot() {
  bot = mineflayer.createBot({
    host: serverHost,
    port: serverPort,
    username: username,
    version: mcVersion,
  });

  bot.on('login', () => {
    console.log(`✅ ${username} joined the server!`);
    bot.chat('BETA12 is online!');
    startMovementLoop();
  });

  bot.on('end', () => {
    console.log('🔁 Bot disconnected. Reconnecting in 10s...');
    setTimeout(createBot, 10000);
  });

  bot.on('error', (err) => {
    console.log('❌ Bot Error:', err.message);
  });
}

// Function to simulate movement
function startMovementLoop() {
  const actions = ['forward', 'back', 'left', 'right', 'jump'];
  setInterval(() => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    if (action === 'jump') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    } else {
      bot.setControlState(action, true);
      setTimeout(() => bot.setControlState(action, false), 1000);
    }
    bot.chat('I am alive and moving!');
  }, 60000); // 1 minute delay between actions
}

// Web server for uptime monitoring
app.get('/', (req, res) => {
  res.send('🌍 Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`🌍 Web server running on port ${PORT}`);
});

// Check server online status every 2 minutes
setInterval(async () => {
  const url = `https://api.mcstatus.io/v2/status/java/${serverHost}:${serverPort}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.online) {
      console.log('🟢 Server is online.');
      if (!bot || bot.player === undefined) {
        console.log('🔁 Reconnecting bot...');
        createBot();
      }
    } else {
      console.log('🔴 Server is offline.');
    }
  } catch (error) {
    console.log('⚠️ Server status check failed:', error.message);
  }
}, 120000); // 2 min = 120000ms

// Start the bot on app launch
createBot();

