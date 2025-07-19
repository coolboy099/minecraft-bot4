const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const ping = require('ping');
const http = require('http');

const SERVER_HOST = 'dttyagi-lol10110.aternos.me';
const SERVER_PORT = 40234;

const START_BOT = 3;
const END_BOT = 20;
let currentBotNumber = START_BOT;
let currentBot = null;

const CHECK_INTERVAL = 2 * 60 * 1000;
const SWITCH_INTERVAL = 4 * 60 * 60 * 1000;

function createBot(username) {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username,
    version: false,
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log(`✅ Bot ${username} spawned.`);
    
    // Auto register/login system
    const password = '123456'; // Change if needed
    let attempts = 0;
    const maxAttempts = 5;

    const tryAuth = () => {
      if (!bot.chat) return;
      if (attempts >= maxAttempts) return;

      attempts++;
      bot.chat(`/register ${password} ${password}`);
      bot.chat(`/login ${password}`);
    };

    const authInterval = setInterval(() => {
      tryAuth();
      if (attempts >= maxAttempts) clearInterval(authInterval);
    }, 4000);

    // Random Movement
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

    setInterval(() => {
      if (!bot.entity) return;
      const pos = bot.entity.position.offset(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
      );
      bot.pathfinder.setGoal(new goals.GoalBlock(pos.x, pos.y, pos.z));
      bot.setControlState('sneak', true);
      if (Math.random() < 0.5) bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
        bot.setControlState('sneak', false);
      }, 1000);
    }, 10000);
  });

  bot.on('end', () => {
    console.log(`❌ Bot ${username} disconnected.`);
    currentBot = null;
  });

  bot.on('error', err => {
    console.log(`⚠️ Bot error: ${err.message}`);
  });

  return bot;
}

function isServerOnline(callback) {
  ping.sys.probe(SERVER_HOST, callback);
}

function tryJoin() {
  if (currentBot) return;
  isServerOnline((isAlive) => {
    if (isAlive) {
      const username = `BETA${currentBotNumber}`;
      console.log(`🟢 Trying bot: ${username}`);
      currentBot = createBot(username);
    } else {
      console.log('🔴 Server is offline.');
    }
  });
}

setInterval(() => {
  if (currentBot) {
    console.log(`🔁 Switching bot...`);
    currentBot.quit();
    currentBotNumber++;
    if (currentBotNumber > END_BOT) currentBotNumber = START_BOT;
    setTimeout(tryJoin, 5000);
  }
}, SWITCH_INTERVAL);

setInterval(() => {
  if (!currentBot) {
    tryJoin();
  }
}, CHECK_INTERVAL);

tryJoin();

http.createServer((req, res) => {
  res.end('Bot is alive');
}).listen(3000);
