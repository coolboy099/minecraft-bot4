const mineflayer = require('mineflayer');
const autoAuth = require('mineflayer-auto-auth');
const fetch = require('node-fetch');
const { pathfinder } = require('mineflayer-pathfinder');

const SERVER_IP = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const MINECRAFT_VERSION = '1.21.4'; // ✅ Update this if needed

let botIndex = 3;
const MAX_BOTS = 20;
let bot = null;

// Get bot name like BETA3, BETA4, ..., BETA20
function getBotUsername(index) {
  return `BETA${index}`;
}

// Create a new bot
function createBot() {
  const username = getBotUsername(botIndex);
  console.log(`🔁 Starting bot ${username}...`);

  bot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: username,
    version: MINECRAFT_VERSION,
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(autoAuth.plugin);

  bot.once('spawn', () => {
    console.log(`✅ Bot ${username} joined the server!`);

    // Set autoAuth password config
    if (bot.autoAuth) {
      bot.autoAuth.options = {
        password: '123456', // ✅ Change this if your server uses another password
        logging: false,
      };
    }

    randomMove();

    // Switch bot after 4 hours
    setTimeout(() => {
      console.log(`⏳ Time's up for ${username}, switching to next bot...`);
      bot.quit();
      botIndex++;
      if (botIndex > MAX_BOTS) botIndex = 3;
    }, 4 * 60 * 60 * 1000); // 4 hours
  });

  bot.on('kicked', (reason) => {
    console.log(`❌ Bot ${username} was kicked: ${reason}`);
    botIndex++;
    if (botIndex > MAX_BOTS) botIndex = 3;
  });

  bot.on('error', (err) => {
    console.log(`⚠️ Bot error: ${err.message}`);
  });

  bot.on('end', () => {
    console.log(`🔌 Bot disconnected. Waiting for server online check...`);
    // Do nothing here. Server checker will handle rejoin.
  });
}

// Random movement
function randomMove() {
  setInterval(() => {
    if (!bot || !bot.entity) return;
    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    bot.setControlState(action, true);
    setTimeout(() => {
      bot.setControlState(action, false);
    }, Math.random() * 1000 + 500);
  }, 5000);
}

// Server online checker every 2 minutes
setInterval(async () => {
  const serverOnline = await isServerOnline();
  if (!serverOnline) {
    console.log(`🔴 Server offline. Waiting...`);
    if (bot) {
      bot.quit();
      bot = null;
    }
  } else {
    if (!bot || !bot.player) {
      console.log(`🟢 Server is online! (Re)starting bot...`);
      createBot();
    }
  }
}, 2 * 60 * 1000);

// Function to check if server is online
async function isServerOnline() {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
    const data = await res.json();
    return data.online && data.port === SERVER_PORT;
  } catch (err) {
    console.log(`🌐 Server check error: ${err.message}`);
    return false;
  }
}

// Start first check
createBot();
