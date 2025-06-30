const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});
app.listen(port, () => {
  console.log(`✅ Web server running on port ${port}`);
});

const SERVER_IP = "dttyagi-lol10110.aternos.me";
const SERVER_PORT = 40234;
const VERSION = "1.12.1";
const USERNAMES = ["BETA3", "BETA4", "BETA5"]; // alag alag username agar zarurat ho

let currentBot = null;
let switchInterval = 4 * 60 * 60 * 1000; // 4 hours
let currentIndex = 0;

function createBot(username) {
  const bot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: username,
    auth: 'offline',
    version: VERSION
  });

  bot.on('login', () => {
    console.log(`✅ ${username} logged in`);
  });

  bot.on('spawn', () => {
    console.log(`🎮 ${username} spawned`);

    // Sneak, jump, move forward repeat
    setInterval(() => {
      bot.setControlState('sneak', true);
      bot.setControlState('forward', true);
      setTimeout(() => {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
          bot.setControlState('sneak', false);
          bot.setControlState('forward', false);
        }, 1000);
      }, 1000);
    }, 60000); // har minute ye actions repeat honge

    // Chat message loop
    const messages = [
      "HELLO! BETA3 is online.",
      "I am a Minecraft Bot.",
      "I love Minecraft!"
    ];
    let i = 0;
    setInterval(() => {
      bot.chat(messages[i]);
      i = (i + 1) % messages.length;
    }, 60000);
  });

  bot.on('end', () => {
    console.log(`❌ ${username} disconnected`);
  });

  bot.on('error', err => {
    console.log(`❌ ${username} error:`, err);
  });

  bot.on('kicked', reason => {
    console.log(`❌ ${username} kicked:`, reason);
  });

  return bot;
}

function switchBot() {
  const nextIndex = (currentIndex + 1) % USERNAMES.length;
  const nextUsername = USERNAMES[nextIndex];

  console.log(`🔁 Trying to switch to ${nextUsername}...`);

  const newBot = createBot(nextUsername);

  newBot.once('spawn', () => {
    console.log(`✅ ${nextUsername} successfully joined. Quitting old bot...`);
    if (currentBot) {
      try {
        currentBot.quit();
      } catch (e) {
        console.log("⚠️ Error quitting old bot:", e);
      }
    }
    currentBot = newBot;
    currentIndex = nextIndex;
  });

  newBot.on('error', (err) => {
    console.log(`❌ Failed to login ${nextUsername}:`, err);
    newBot.quit();
  });
}

// Start first bot
currentBot = createBot(USERNAMES[currentIndex]);

// Every 4 hours, switch to a new bot
setInterval(switchBot, switchInterval);

// Freeze check
setInterval(() => {
  if (!currentBot || !currentBot.player) {
    console.log("🛑 Bot freeze detected. Restarting...");
    try {
      currentBot.quit();
    } catch (e) {}
    currentBot = createBot(USERNAMES[currentIndex]);
  }
}, 5 * 60 * 1000); // every 5 mins


