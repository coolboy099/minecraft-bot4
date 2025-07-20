const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const http = require('http');

const SERVER_IP = "dttyagi-lol10110.aternos.me";
const SERVER_PORT = 40234;

let bot;
let botNumber = 12;

function createBot() {
  const username = `BETA${botNumber}`;
  bot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: username,
    version: "1.21.1"
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log(`✅ ${username} joined the server!`);

    // Auto /register or /login
    setTimeout(() => {
      bot.chat('/register 123456 123456');
      bot.chat('/login 123456');
    }, 5000);

    // Random movement loop
    setInterval(() => {
      const x = bot.entity.position.x + (Math.random() * 10 - 5);
      const z = bot.entity.position.z + (Math.random() * 10 - 5);
      const y = bot.entity.position.y;
      bot.pathfinder.setGoal(new mineflayer.pathfinder.goals.GoalBlock(x, y, z));
    }, 10000);
  });

  bot.on('error', err => {
    console.log(`❌ Bot Error: ${err.message}`);
  });

  bot.on('end', () => {
    console.log("❌ Bot disconnected. Reconnecting in 2 minutes...");
    setTimeout(createBot, 2 * 60 * 1000);
  });
}

createBot();

// Web server for Render uptime
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(3000);

