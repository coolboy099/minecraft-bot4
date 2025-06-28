const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(port, () => {
  console.log(`✅ Web server running on port ${port}`);
});

// ✅ Yaha config object wrap kiya gaya hai
const config = {
  "bot-account": {
    "username": "BETA",
    "password": "",
    "type": "mojang"
  },

  "server": {
    "ip": "dttyagi-lol10110.aternos.me",
    "port": 40234,
    "version": "1.12.1"
  },

  "position": {
    "enabled": false,
    "x": 0,
    "y": 0,
    "z": 0
  },

  "utils": {
    "auto-auth": {
      "enabled": false,
      "password": ""
    },

    "anti-afk": {
      "enabled": true,
      "sneak": true
    },

    "chat-messages": {
      "enabled": true,
      "repeat": true,
      "repeat-delay": 60,

      "messages": [
        "MY FATHER NAME IS COOLBOY",
        "COOL IS THE BEST PLAYER OF MINECRAFT!",
        "I Like to Play Minecraft!"
      ]
    },

    "chat-log": true,
    "auto-reconnect": true,
    "auto-reconnect-delay": 10
  }
};

// ✅ Bot code
let bot;

function createBot() {
  bot = mineflayer.createBot({
    host: config.server.ip,
    port: config.server.port,
    username: config["bot-account"].username,
    auth: config["bot-account"].type === "mojang" ? "mojang" : "offline",
    version: config.server.version
  });

  bot.on('login', () => {
    console.log('✅ Bot logged in!');
  });

  bot.on('spawn', () => {
    console.log('🎮 Bot spawned in the server');

    // Anti-AFK
    if (config.utils["anti-afk"].enabled) {
      setInterval(() => {
        if (config.utils["anti-afk"].sneak) {
          bot.setControlState('sneak', true);
          setTimeout(() => bot.setControlState('sneak', false), 2000);
        }
      }, 60000);
    }

    // Chat Messages
    if (config.utils["chat-messages"].enabled) {
      let index = 0;
      setInterval(() => {
        bot.chat(config.utils["chat-messages"].messages[index]);
        index = (index + 1) % config.utils["chat-messages"].messages.length;
      }, config.utils["chat-messages"]["repeat-delay"] * 1000);
    }
  });

  bot.on('end', () => {
    console.log('❌ Bot disconnected. Reconnecting...');
    if (config.utils["auto-reconnect"]) {
      setTimeout(createBot, config.utils["auto-reconnect-delay"] * 1000);
    }
  });

  bot.on('error', err => {
    console.log('❌ Bot error:', err);
  });

  bot.on('kicked', reason => {
    console.log('❌ Bot kicked:', reason);
  });
}

createBot();
