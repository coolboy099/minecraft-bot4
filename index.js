const express = require("express");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } =
  require("mineflayer-pathfinder");

const app = express();
const PORT = process.env.PORT || 10000;

// Render + UptimeRobot
app.get("/", (req, res) => {
  res.send("Minecraft bot is running!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: bot?.entity ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime())
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// Minecraft settings
const SERVER = {
  host: "Players-K8CW.aternos.me",
  port: 20822
};

// Use accounts you actually control.
const BOTS = [
  "betag1",
  "betag2",
  "betag3",
  "betag4",
  "betag5"
];

let current = 0;
let bot = null;

let reconnectTimer = null;
let rotationTimer = null;
let movementTimer = null;
let breakTimer = null;

function startBot() {
  const username = BOTS[current];

  console.log(`Starting ${username}...`);

  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: username
  });

  bot.loadPlugin(pathfinder);

  bot.once("spawn", () => {
    console.log(`${username} joined!`);

    const mcData = require("minecraft-data")(bot.version);
    const movements = new Movements(bot, mcData);

    bot.pathfinder.setMovements(movements);

    startMovement();
    startBreaking();

    // Rotate after 5 hours.
    rotationTimer = setTimeout(() => {
      rotateBot();
    }, 5 * 60 * 60 * 1000);
  });

  bot.on("kicked", reason => {
    console.log("Kicked:", reason);

    // Don't switch accounts to bypass a ban.
    cleanup();

    reconnectTimer = setTimeout(() => {
      startBot();
    }, 60 * 1000);
  });

  bot.on("end", () => {
    console.log("Disconnected.");

    cleanup();

    reconnectTimer = setTimeout(() => {
      startBot();
    }, 60 * 1000);
  });

  bot.on("error", err => {
    console.log("Error:", err.message);
  });
}

// Random movement
function startMovement() {
  movementTimer = setInterval(() => {
    if (!bot || !bot.entity) return;

    const x = bot.entity.position.x + random(-5, 5);
    const z = bot.entity.position.z + random(-5, 5);
    const y = bot.entity.position.y;

    bot.pathfinder.setGoal(
      new goals.GoalNear(x, y, z, 2)
    );

  }, 15000);
}

// Break a nearby block every 5 minutes
function startBreaking() {
  breakTimer = setInterval(async () => {
    if (!bot || !bot.entity) return;

    try {
      const block = bot.findBlock({
        matching: b =>
          b &&
          b.name !== "air" &&
          b.name !== "bedrock" &&
          b.name !== "water" &&
          b.name !== "lava",
        maxDistance: 4
      });

      if (!block) return;

      await bot.lookAt(
        block.position.offset(0.5, 0.5, 0.5)
      );

      if (bot.canDigBlock(block)) {
        await bot.dig(block);
        console.log(`Broke ${block.name}`);
      }

    } catch (err) {
      console.log("Break error:", err.message);
    }

  }, 5 * 60 * 1000);
}

// Rotate normally after 5 hours
function rotateBot() {
  console.log("5 hours completed.");

  cleanup();

  if (bot) {
    try {
      bot.quit("Scheduled rotation");
    } catch {}
  }

  bot = null;

  current = (current + 1) % BOTS.length;

  setTimeout(() => {
    startBot();
  }, 60 * 1000);
}

function cleanup() {
  if (movementTimer) {
    clearInterval(movementTimer);
    movementTimer = null;
  }

  if (breakTimer) {
    clearInterval(breakTimer);
    breakTimer = null;
  }

  if (rotationTimer) {
    clearTimeout(rotationTimer);
    rotationTimer = null;
  }
}

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

startBot();
