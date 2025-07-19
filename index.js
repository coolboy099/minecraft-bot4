const mineflayer = require('mineflayer');
const autoAuth = require('mineflayer-auto-auth');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const ping = require('ping');
const http = require('http');

const SERVER_HOST = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;
const START_BOT = 3;
const END_BOT = 20;
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
const SWITCH_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

let currentBotNumber = START_BOT;
let currentBot = null;

function createBot(username) {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username,
    version: false,
    plugins: {
      'mineflayer-auto-auth': autoAuth
    },
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);
  bot.once('spawn', () => {
    console.log(`✅ ${username} joined the server.`);

    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

    // Movement Loop
    setInterval(() => {
      if (!bot.entity) return;
      const pos = bot.entity.position.offset(
        (Math.random() - 0.5) * 5,
        0,
        (Math.random() - 0.5) * 5
      );
      bot.pathfinder.setGoal(new goals.GoalBlock(pos.x, pos.y, pos.z));
      if (Math.random() < 0.5) bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 10_000);
  });

  bot.on('error', err => {
    console.log(`❌ Bot Error: ${err.code || err.message}`);
  });

  bot.on('end', () => {
    console.log(`❌ ${username} disconnected.`);
    currentBot = null;
  });

  return bot;
}

function isServerOnline(callback) {
  ping.sys.probe(SERVER_HOST, function(isAlive) {
    callback(isAlive);
  });
}

function tryJoin() {
  if (currentBot) return;

  isServerOnline(isOnline => {
    if (isOnline) {
      const username = `BETA${currentBotNumber}`;
      console.log(`🟢 Trying bot: ${username}`);
      currentBot = createBot(username);
    } else {
      console.log('🔴 Server is offline.');
    }
  });
}

// Auto bot switch after every 4 hours
setInterval(() => {
  if (currentBot) {
    console.log(`♻️ Switching bot...`);
    currentBot.quit();
    currentBotNumber++;
    if (currentBotNumber > END_BOT) currentBotNumber = START_BOT;
    setTimeout(tryJoin, 5000);
  }
}, SWITCH_INTERVAL);

// Check every 2 mins if bot is offline & server is online
setInterval(tryJoin, CHECK_INTERVAL);

// Initial bot join
tryJoin();

// Web server for Render keep-alive
http.createServer((req, res) => {
  res.end('Bot is alive');
}).listen(3000);
