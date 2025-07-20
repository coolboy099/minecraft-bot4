const mineflayer = require('mineflayer');
const autoAuth = require('mineflayer-auto-auth');
const fetch = require('node-fetch');
const { pathfinder } = require('mineflayer-pathfinder');

const SERVER_IP = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const MINECRAFT_VERSION = '1.21.4'; // ✅ change to match your Aternos version

let botIndex = 3;
const MAX_BOTS = 20;
let bot;

function getBotUsername(index) {
  return `BETA${index}`;
}

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
  bot.loadPlugin(autoAuth);

  bot.once('spawn', () => {
    console.log(`✅ Bot ${username} joined the server!`);

    randomMove();

    // Switch bot every 4 hours
    setTimeout(() => {
      console.log(`⏳ Time's up for ${username}, switching bot...`);
      bot.quit();
      botIndex++;
      if (botIndex > MAX_BOTS) botIndex = 3;
      createBot();
    }, 4 * 60 * 60 * 1000); // 4 hours
  });

  bot.on('kicked', (reason) => {
    console.log(`❌ Bot ${username} was kicked: ${reason}`);
    botIndex++;
    if (botIndex > MAX_BOTS) botIndex = 3;
    createBot();
  });

  bot.on('error', (err) => {
    console.log(`⚠️ Bot error: ${err.message}`);
  });

  bot.on('end', () => {
    console.log(`🔌 Bot disconnected. Reconnecting in 10s...`);
    setTimeout(() => {
      createBot();
    }, 10000);
  });
}

// 🔄 Random movement
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

// 🌐 Check if server is online every 2 minutes
setInterval(async () => {
  const serverOnline = await isServerOnline();
  if (!serverOnline) {
    console.log(`🔴 Server offline. Waiting...`);
    if (bot) bot.quit();
  } else {
    if (!bot || !bot.player) {
      console.log(`🟢 Server is online! (re)starting bot...`);
      createBot();
    }
  }
}, 2 * 60 * 1000);

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

// 🔰 Start first bot
createBot();
