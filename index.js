require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const VKAP_MINT = process.env.VKAP_MINT;

const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY;

const WALLETS = {
  1: process.env.PUMP_KEY_1,
  2: process.env.PUMP_KEY_2,
  3: process.env.PUMP_KEY_3
};

const MAX_TRADE_SOL = 0.5;

let autoBuyEnabled = true;
const AUTO_BUY_AMOUNT = 0.006;
const AUTO_BUY_INTERVAL = 10 * 60 * 1000;

async function trade(privateKey, action, amount) {
  if (!privateKey) {
    throw new Error("Wallet private key missing");
  }

  if (!PUMPPORTAL_API_KEY) {
    throw new Error("PumpPortal API key missing");
  }

  const res = await fetch(
    https://pumpportal.fun/api/trade?api-key=${PUMPPORTAL_API_KEY},
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action,
        mint: VKAP_MINT,
        amount,
        denominatedInSol: "true",
        slippage: 10,
        priorityFee: 0.00005,
        pool: "pump",
        privateKey
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

bot.onText(/\/buy_wallet (\d+) ([\d.]+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletId = match[1];
  const amount = parseFloat(match[2]);

  if (amount > MAX_TRADE_SOL) {
    return bot.sendMessage(chatId, Max trade is ${MAX_TRADE_SOL} SOL);
  }

  const walletKey = WALLETS[walletId];

  if (!walletKey) {
    return bot.sendMessage(chatId, "Wallet not found");
  }

  try {
    await trade(walletKey, "buy", amount);
    bot.sendMessage(chatId, Buy successful ✅\nWallet: ${walletId});
  } catch (err) {
    bot.sendMessage(chatId, Buy failed ❌\nWallet: ${walletId}\n${err.message});
  }
});

bot.onText(/\/sell_wallet (\d+) ([\d.]+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletId = match[1];
  const amount = parseFloat(match[2]);

  const walletKey = WALLETS[walletId];

  if (!walletKey) {
    return bot.sendMessage(chatId, "Wallet not found");
  }

  try {
    await trade(walletKey, "sell", amount);
    bot.sendMessage(chatId, Sell successful ✅\nWallet: ${walletId});
  } catch (err) {
    bot.sendMessage(chatId, Sell failed ❌\nWallet: ${walletId}\n${err.message});
  }
});

async function autoBuyAll() {
  if (!autoBuyEnabled) return;

  for (const walletId of Object.keys(WALLETS)) {
    try {
      await trade(WALLETS[walletId], "buy", AUTO_BUY_AMOUNT);
    } catch (err) {
      console.log(Auto buy failed wallet ${walletId}:, err.message);
    }
  }
}

setInterval(autoBuyAll, AUTO_BUY_INTERVAL);

bot.onText(/\/autobuy_on/, (msg) => {
  autoBuyEnabled = true;
  bot.sendMessage(msg.chat.id, "Auto buy enabled ✅");
});

bot.onText(/\/autobuy_off/, (msg) => {
  autoBuyEnabled = false;
  bot.sendMessage(msg.chat.id, "Auto buy disabled ❌");
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    Bot status:\nAuto buy: ${autoBuyEnabled ? "ON" : "OFF"}
  );
});
