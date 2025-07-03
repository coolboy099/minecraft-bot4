const express = require('express');
const mineflayer = require('mineflayer');
const dns = require('dns');

const app = express();
const port = 3000;

let bot;

function createBot() {
  if (bot) {
    try { bot.quit(); } catch (e) {}
  }

  bot = mineflayer.createBot({
    host: 'dttyagi-lol10110.aternos.me',
    port: 40234,
    username: 'BETA3',
    version: '1.12.1'
  });

  bot.on('login', () => {
    console.log("✅ Bot Logged In");
  });

  bot.on('spawn', () => {
    console.log("🎮 Bot Spawned in Server");
  });

  bot.on('end', () => {
    console.log("❌ Bot Disconnected");
  });

  bot.on('error', err => {
    console.log("❌ Bot Error:", err);
  });
}

function isServerOnline(callback) {
  dns.lookup('dttyagi-lol10110.aternos.me', (err) => {
    if (err && err.code == "ENOTFOUND") {
      callback(false);
    } else {
      callback(true);
    }
  });
}

setInterval(() => {
  isServerOnline((online) => {
    if (online) {
      console.log("✅ Server online, checking bot...");
      if (!bot || !bot.player) {
        console.log("🔁 Reconnecting bot...");
        createBot();
      }
    } else {
      console.log("🕑 Server offline. Waiting...");
    }
  });
}, 2 * 60 * 1000); // har 2 minute me check

app.get("/", (req, res) => {
  res.send("✅ Bot is alive and auto-reconnecting.");
});

app.listen(port, () => {
  console.log(`🌍 Web server running on port ${port}`);
});
