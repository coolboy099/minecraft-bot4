const express = require("express");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } =
  require("mineflayer-pathfinder");

// =========================
// RENDER WEB SERVER
// =========================

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Minecraft bot is running!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    bot: bot?.entity ? "connected" : "disconnected",
    currentBot: BOT_NAMES[currentBot],
    uptime: Math.floor(process.uptime())
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server listening on ${PORT}`);
});

// =========================
// MINECRAFT CONFIG
// =========================

const SERVER = {
  host: "dttyagi.aternos.me",
  port: 20822
};

// Your own bot accounts
const BOT_NAMES = [
  "betag1",
  "betag2",
  "betag3",
  "betag4",
  "betag5"
];

// =========================
// TIMING
// =========================

const RECONNECT_DELAY = 60 * 1000;       // 1 minute
const BOT_ROTATION = 5 * 60 * 60 * 1000; // 5 hours
const CHAT_INTERVAL = 2 * 60 * 1000;    // 2 minutes
const BREAK_INTERVAL = 5 * 60 * 1000;   // 5 minutes

// =========================
// VARIABLES
// =========================

let bot = null;
let currentBot = 0;

let movementTimer = null;
let chatTimer = null;
let breakTimer = null;
let rotationTimer = null;
let reconnectTimer = null;

let movementTimeout = null;

// =========================
// CHAT MESSAGES
// =========================

const messages = [
  "Hello I am bot",
  "Made by divyansh daddy",
  "Arey u doing fun?",
  "I am just chilling here 😎",
  "Minecraft life OP hai 😂",
  "Kya scene hai bro?"
];

// =========================
// START BOT
// =========================

function startBot() {

  clearReconnect();

  const username = BOT_NAMES[currentBot];

  console.log("--------------------------------");
  console.log(`Starting bot: ${username}`);
  console.log("--------------------------------");

  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: username
  });

  bot.loadPlugin(pathfinder);

  // =========================
  // SPAWN
  // =========================

  bot.once("spawn", () => {

    console.log(`${username} joined the server!`);

    const mcData = require("minecraft-data")(bot.version);

    const movements = new Movements(
      bot,
      mcData
    );

    bot.pathfinder.setMovements(movements);

    startRandomMovement();
    startChat();
    startBlockBreaking();

    // Rotate after 5 hours
    rotationTimer = setTimeout(() => {
      rotateBot();
    }, BOT_ROTATION);

  });

  // =========================
  // DEATH
  // =========================

  bot.on("death", () => {

    console.log(`${username} died.`);

    // Minecraft normally respawns automatically.
    setTimeout(() => {

      if (bot && bot.isAlive === false) {
        try {
          bot.respawn();
        } catch {}
      }

    }, 1000);

  });

  // =========================
  // KICK
  // =========================

  bot.on("kicked", reason => {

    console.log("Bot kicked:", reason);

    cleanup();

    scheduleReconnect();

  });

  // =========================
  // DISCONNECT
  // =========================

  bot.on("end", reason => {

    console.log("Connection ended:", reason);

    cleanup();

    scheduleReconnect();

  });

  // =========================
  // ERROR
  // =========================

  bot.on("error", err => {

    console.log("Bot error:", err.message);

  });

}


// =====================================================
// RANDOM MOVEMENT
// =====================================================

function startRandomMovement() {

  stopMovement();

  function randomMove() {

    if (!bot || !bot.entity) {
      return;
    }

    // Clear old controls
    bot.clearControlStates();

    // Random direction
    const directions = [
      "forward",
      "back",
      "left",
      "right"
    ];

    const direction =
      directions[random(0, directions.length - 1)];

    // Random duration
    const duration =
      random(1000, 6000);

    console.log(
      `Movement: ${direction} for ${duration}ms`
    );

    bot.setControlState(
      direction,
      true
    );

    // Random jump
    if (Math.random() < 0.35) {

      setTimeout(() => {

        if (bot && bot.entity) {
          bot.setControlState("jump", true);

          setTimeout(() => {

            if (bot && bot.entity) {
              bot.setControlState("jump", false);
            }

          }, 400);
        }

      }, random(300, 2000));

    }

    // Random sneak
    if (Math.random() < 0.25) {

      bot.setControlState("sneak", true);

      setTimeout(() => {

        if (bot && bot.entity) {
          bot.setControlState("sneak", false);
        }

      }, random(1000, 4000));

    }

    // Stop current movement
    movementTimeout = setTimeout(() => {

      if (!bot || !bot.entity) {
        return;
      }

      bot.clearControlStates();

      // Wait before next movement
      setTimeout(() => {

        if (bot && bot.entity) {
          randomMove();
        }

      }, random(500, 3000));

    }, duration);

  }

  randomMove();
}


// =====================================================
// CHAT
// =====================================================

function startChat() {

  stopChat();

  let lastMessage = -1;

  chatTimer = setInterval(() => {

    if (!bot || !bot.entity) {
      return;
    }

    let index;

    // Avoid repeating same message
    do {
      index = random(0, messages.length - 1);
    } while (
      index === lastMessage &&
      messages.length > 1
    );

    lastMessage = index;

    const message = messages[index];

    console.log(`CHAT: ${message}`);

    bot.chat(message);

  }, CHAT_INTERVAL);

}


// =====================================================
// BREAK BLOCK EVERY 5 MIN
// =====================================================

function startBlockBreaking() {

  stopBreaking();

  breakTimer = setInterval(async () => {

    if (!bot || !bot.entity) {
      return;
    }

    try {

      const block = bot.findBlock({

        matching: block => {

          if (!block) return false;

          return (
            block.name !== "air" &&
            block.name !== "bedrock" &&
            block.name !== "water" &&
            block.name !== "lava" &&
            block.diggable
          );

        },

        maxDistance: 4

      });

      if (!block) {

        console.log(
          "No suitable block nearby."
        );

        return;

      }

      console.log(
        `Breaking block: ${block.name}`
      );

      await bot.lookAt(
        block.position.offset(
          0.5,
          0.5,
          0.5
        )
      );

      if (bot.canDigBlock(block)) {

        await bot.dig(block);

        console.log(
          "Block broken!"
        );

      }

    } catch (error) {

      console.log(
        "Block break error:",
        error.message
      );

    }

  }, BREAK_INTERVAL);

}


// =====================================================
// 5-HOUR BOT ROTATION
// =====================================================

function rotateBot() {

  console.log(
    "5 hours completed."
  );

  cleanup();

  if (bot) {

    try {

      bot.clearControlStates();

      bot.quit(
        "Scheduled bot rotation"
      );

    } catch {}

  }

  bot = null;

  currentBot++;

  if (currentBot >= BOT_NAMES.length) {
    currentBot = 0;
  }

  console.log(
    `Next bot: ${BOT_NAMES[currentBot]}`
  );

  setTimeout(() => {

    startBot();

  }, RECONNECT_DELAY);

}


// =====================================================
// RECONNECT
// =====================================================

function scheduleReconnect() {

  if (reconnectTimer) {
    return;
  }

  console.log(
    "Reconnecting in 1 minute..."
  );

  reconnectTimer = setTimeout(() => {

    reconnectTimer = null;

    startBot();

  }, RECONNECT_DELAY);

}


// =====================================================
// CLEANUP
// =====================================================

function cleanup() {

  stopMovement();
  stopChat();
  stopBreaking();

  if (rotationTimer) {

    clearTimeout(
      rotationTimer
    );

    rotationTimer = null;

  }

}


// =====================================================
// STOP MOVEMENT
// =====================================================

function stopMovement() {

  if (movementTimeout) {

    clearTimeout(
      movementTimeout
    );

    movementTimeout = null;

  }

  if (bot) {

    try {
      bot.clearControlStates();
    } catch {}

  }

}


// =====================================================
// STOP CHAT
// =====================================================

function stopChat() {

  if (chatTimer) {

    clearInterval(
      chatTimer
    );

    chatTimer = null;

  }

}


// =====================================================
// STOP BLOCK BREAKING
// =====================================================

function stopBreaking() {

  if (breakTimer) {

    clearInterval(
      breakTimer
    );

    breakTimer = null;

  }

}


// =====================================================
// CLEAR RECONNECT
// =====================================================

function clearReconnect() {

  if (reconnectTimer) {

    clearTimeout(
      reconnectTimer
    );

    reconnectTimer = null;

  }

}


// =====================================================
// RANDOM NUMBER
// =====================================================

function random(min, max) {

  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;

}


// =====================================================
// START
// =====================================================

startBot();
