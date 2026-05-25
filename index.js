require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const VKAP_MINT = process.env.VKAP_MINT;
const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY;

const MAIN_PRIVATE_KEY = process.env.PUMP_KEY_1;

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
  if (!PUMPPORTAL_API_KEY) throw new Error('PUMPPORTAL_API_KEY missing');
  if (!VKAP_MINT) throw new Error('VKAP_MINT missing');
  if (!privateKey) throw new Error('Private key missing');

  const res = await fetch(`https://pumpportal.fun/api/trade-local?api-key=${PUMPPORTAL_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: action,
      mint: VKAP_MINT,
      amount: amount,
      denominatedInSol: true,
      slippage: 15,
      priorityFee: 0.001,
      pool: 'pump',
      privateKey: privateKey
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  if (data.errors && data.errors.length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data;
}

setInterval(async () => {
  if (!autoBuyEnabled) return;

  try {
    const result = await trade(MAIN_PRIVATE_KEY, 'buy', AUTO_BUY_AMOUNT);
    console.log('MAIN AUTO BUY:', result);
  } catch (err) {
    console.log('MAIN AUTO BUY ERROR:', err.message);
  }
}, AUTO_BUY_INTERVAL);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `VKAP Bot online ✅

/status
/wallets
/start_auto
/stop_auto

/buy_main 0.01
/sell_main 0.01

/buy_wallet 1 0.01
/buy_wallet 2 0.01
/buy_wallet 3 0.01

/sell_wallet 1 0.01
/sell_wallet 2 0.01
/sell_wallet 3 0.01`);
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, `Status ✅
Auto-buy main: ${autoBuyEnabled ? 'ON' : 'OFF'}
Auto amount: ${AUTO_BUY_AMOUNT} SOL / 10 min
Max trade: ${MAX_TRADE_SOL} SOL`);
});

bot.onText(/\/wallets/, (msg) => {
  bot.sendMessage(msg.chat.id, `Wallets:
Main/PUMP_KEY_1: ${WALLETS[1] ? '✅' : '❌'}
PUMP_KEY_2: ${WALLETS[2] ? '✅' : '❌'}
PUMP_KEY_3: ${WALLETS[3] ? '✅' : '❌'}`);
});

bot.onText(/\/start_auto/, (msg) => {
  autoBuyEnabled = true;
  bot.sendMessage(msg.chat.id, 'Auto-buy ON ✅');
});

bot.onText(/\/stop_auto/, (msg) => {
  autoBuyEnabled = false;
  bot.sendMessage(msg.chat.id, 'Auto-buy OFF 🛑');
});

bot.onText(/\/buy_main (.+)/, async (msg, match) => {
  const amount = Number(match[1]);

  if (!amount || amount <= 0) return bot.sendMessage(msg.chat.id, 'Use: /buy_main 0.01');
  if (amount > MAX_TRADE_SOL) return bot.sendMessage(msg.chat.id, `Max ${MAX_TRADE_SOL} SOL`);

  try {
    const result = await trade(MAIN_PRIVATE_KEY, 'buy', amount);
    bot.sendMessage(msg.chat.id, `Main buy ✅\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Main buy failed ❌\n${err.message}`);
  }
});

bot.onText(/\/sell_main (.+)/, async (msg, match) => {
  const amount = Number(match[1]);

  if (!amount || amount <= 0) return bot.sendMessage(msg.chat.id, 'Use: /sell_main 0.01');
  if (amount > MAX_TRADE_SOL) return bot.sendMessage(msg.chat.id, `Max ${MAX_TRADE_SOL} SOL`);

  try {
    const result = await trade(MAIN_PRIVATE_KEY, 'sell', amount);
    bot.sendMessage(msg.chat.id, `Main sell ✅\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Main sell failed ❌\n${err.message}`);
  }
});

bot.onText(/\/buy_wallet (\d+) (.+)/, async (msg, match) => {
  const walletId = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletId)) return bot.sendMessage(msg.chat.id, 'Use wallet 1, 2, or 3.');
  if (!amount || amount <= 0) return bot.sendMessage(msg.chat.id, 'Use: /buy_wallet 2 0.01');
  if (amount > MAX_TRADE_SOL) return bot.sendMessage(msg.chat.id, `Max ${MAX_TRADE_SOL} SOL`);

  try {
    const result = await trade(WALLETS[walletId], 'buy', amount);
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} buy ✅\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} buy failed ❌\n${err.message}`);
  }
});

bot.onText(/\/sell_wallet (\d+) (.+)/, async (msg, match) => {
  const walletId = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletId)) return bot.sendMessage(msg.chat.id, 'Use wallet 1, 2, or 3.');
  if (!amount || amount <= 0) return bot.sendMessage(msg.chat.id, 'Use: /sell_wallet 2 0.01');
  if (amount > MAX_TRADE_SOL) return bot.sendMessage(msg.chat.id, `Max ${MAX_TRADE_SOL} SOL`);

  try {
    const result = await trade(WALLETS[walletId], 'sell', amount);
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} sell ✅\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} sell failed ❌\n${err.message}`);
  }
});

console.log('VKAP Bot started');
