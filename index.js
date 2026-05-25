require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const VKAP_MINT = process.env.VKAP_MINT;

const MAIN_KEY = process.env.PUMPPORTAL_API_KEY;

const WALLETS = {
  1: process.env.PUMP_KEY_1,
  2: process.env.PUMP_KEY_2,
  3: process.env.PUMP_KEY_3
};

const MAX_BUY_SOL = 0.02;

let autoBuyEnabled = true;
const AUTO_BUY_AMOUNT = 0.006;
const AUTO_BUY_INTERVAL = 10 * 60 * 1000;

async function buyWithApiKey(apiKey, amount) {
  const res = await fetch(`https://pumpportal.fun/api/trade?api-key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'buy',
      mint: VKAP_MINT,
      amount,
      denominatedInSol: 'true',
      slippage: 10,
      priorityFee: 0.00005,
      pool: 'pump'
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

setInterval(async () => {
  if (!autoBuyEnabled) return;

  try {
    const result = await buyWithApiKey(MAIN_KEY, AUTO_BUY_AMOUNT);
    console.log('MAIN AUTO BUY:', result);
  } catch (err) {
    console.log('MAIN AUTO BUY ERROR:', err.message);
  }
}, AUTO_BUY_INTERVAL);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'VKAP Mix Bot online ✅\n\nCommands:\n/status\n/start_auto\n/stop_auto\n/wallets\n/buy_wallet 1 0.003\n/buy_wallet 2 0.01\n/buy_wallet 3 0.003'
  );
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Status ✅\nAuto-buy main wallet: ${autoBuyEnabled ? 'ON' : 'OFF'}\nAuto amount: ${AUTO_BUY_AMOUNT} SOL / 10 min\nMint: ${VKAP_MINT}`
  );
});

bot.onText(/\/start_auto/, (msg) => {
  autoBuyEnabled = true;
  bot.sendMessage(msg.chat.id, 'Auto-buy main wallet ON ✅');
});

bot.onText(/\/stop_auto/, (msg) => {
  autoBuyEnabled = false;
  bot.sendMessage(msg.chat.id, 'Auto-buy main wallet OFF 🛑');
});

bot.onText(/\/wallets/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Wallets loaded:\nMain: ${MAIN_KEY ? '✅' : '❌'}\n1: ${WALLETS[1] ? '✅' : '❌'}\n2: ${WALLETS[2] ? '✅' : '❌'}\n3: ${WALLETS[3] ? '✅' : '❌'}`
  );
});

bot.onText(/\/buy_wallet (\d+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletNumber = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletNumber)) {
    return bot.sendMessage(chatId, 'Use wallet 1, 2, or 3.');
  }

  if (!amount || amount <= 0) {
    return bot.sendMessage(chatId, 'Use: /buy_wallet 2 0.01');
  }

  if (amount > MAX_BUY_SOL) {
    return bot.sendMessage(chatId, `Max buy is ${MAX_BUY_SOL} SOL`);
  }

  try {
    const result = await buyWithApiKey(WALLETS[walletNumber], amount);
    bot.sendMessage(chatId, `Buy sent ✅\nWallet: ${walletNumber}\nAmount: ${amount} SOL\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(chatId, `Buy failed ❌\nWallet: ${walletNumber}\nError: ${err.message}`);
  }
});

console.log('VKAP Mix Bot started');
