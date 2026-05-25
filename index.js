require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const VKAP_MINT = process.env.VKAP_MINT;

const MAIN_KEY = process.env.PUMPPORTAL_API_KEY;

const WALLETS = {
  main: MAIN_KEY,
  1: process.env.PUMP_KEY_1,
  2: process.env.PUMP_KEY_2,
  3: process.env.PUMP_KEY_3
};

const MAX_TRADE_SOL = 0.5;

let autoBuyEnabled = true;
const AUTO_BUY_AMOUNT = 0.006;
const AUTO_BUY_INTERVAL = 10 * 60 * 1000;

async function trade(apiKey, action, amount) {
  if (!apiKey) {
    throw new Error('API key missing');
  }

  const res = await fetch(`https://pumpportal.fun/api/trade?api-key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
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
    const result = await trade(MAIN_KEY, 'buy', AUTO_BUY_AMOUNT);
    console.log('MAIN AUTO BUY:', result);
  } catch (err) {
    console.log('MAIN AUTO BUY ERROR:', err.message);
  }
}, AUTO_BUY_INTERVAL);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `VKAP Mix Bot online ✅

Commands:
/status
/wallets
/start_auto
/stop_auto

Manual BUY:
/buy_main 0.01
/buy_wallet 1 0.01
/buy_wallet 2 0.01
/buy_wallet 3 0.01

Manual SELL:
/sell_main 0.01
/sell_wallet 1 0.01
/sell_wallet 2 0.01
/sell_wallet 3 0.01`
  );
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Status ✅
Auto-buy main wallet: ${autoBuyEnabled ? 'ON' : 'OFF'}
Auto-buy amount: ${AUTO_BUY_AMOUNT} SOL / 10 min
Max manual trade: ${MAX_TRADE_SOL} SOL
Mint: ${VKAP_MINT}`
  );
});

bot.onText(/\/wallets/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Wallets loaded:
Main: ${WALLETS.main ? '✅' : '❌'}
1: ${WALLETS[1] ? '✅' : '❌'}
2: ${WALLETS[2] ? '✅' : '❌'}
3: ${WALLETS[3] ? '✅' : '❌'}`
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

bot.onText(/\/buy_main (.+)/, async (msg, match) => {
  const amount = Number(match[1]);

  if (!amount || amount <= 0) {
    return bot.sendMessage(msg.chat.id, 'Use: /buy_main 0.01');
  }

  if (amount > MAX_TRADE_SOL) {
    return bot.sendMessage(msg.chat.id, `Max trade is ${MAX_TRADE_SOL} SOL`);
  }

  try {
    const result = await trade(WALLETS.main, 'buy', amount);
    bot.sendMessage(msg.chat.id, `Main buy sent ✅\nAmount: ${amount} SOL\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Main buy failed ❌\n${err.message}`);
  }
});

bot.onText(/\/sell_main (.+)/, async (msg, match) => {
  const amount = Number(match[1]);

  if (!amount || amount <= 0) {
    return bot.sendMessage(msg.chat.id, 'Use: /sell_main 0.01');
  }

  if (amount > MAX_TRADE_SOL) {
    return bot.sendMessage(msg.chat.id, `Max trade is ${MAX_TRADE_SOL} SOL`);
  }

  try {
    const result = await trade(WALLETS.main, 'sell', amount);
    bot.sendMessage(msg.chat.id, `Main sell sent ✅\nTarget: ${amount} SOL\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Main sell failed ❌\n${err.message}`);
  }
});

bot.onText(/\/buy_wallet (\d+) (.+)/, async (msg, match) => {
  const walletNumber = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletNumber)) {
    return bot.sendMessage(msg.chat.id, 'Use wallet 1, 2, or 3.');
  }

  if (!amount || amount <= 0) {
    return bot.sendMessage(msg.chat.id, 'Use: /buy_wallet 2 0.01');
  }

  if (amount > MAX_TRADE_SOL) {
    return bot.sendMessage(msg.chat.id, `Max trade is ${MAX_TRADE_SOL} SOL`);
  }

  try {
    const result = await trade(WALLETS[walletNumber], 'buy', amount);
    bot.sendMessage(msg.chat.id, `Buy sent ✅\nWallet: ${walletNumber}\nAmount: ${amount} SOL\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Buy failed ❌\nWallet: ${walletNumber}\n${err.message}`);
  }
});

bot.onText(/\/sell_wallet (\d+) (.+)/, async (msg, match) => {
  const walletNumber = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletNumber)) {
    return bot.sendMessage(msg.chat.id, 'Use wallet 1, 2, or 3.');
  }

  if (!amount || amount <= 0) {
    return bot.sendMessage(msg.chat.id, 'Use: /sell_wallet 2 0.01');
  }

  if (amount > MAX_TRADE_SOL) {
    return bot.sendMessage(msg.chat.id, `Max trade is ${MAX_TRADE_SOL} SOL`);
  }

  try {
    const result = await trade(WALLETS[walletNumber], 'sell', amount);
    bot.sendMessage(msg.chat.id, `Sell sent ✅\nWallet: ${walletNumber}\nTarget: ${amount} SOL\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Sell failed ❌\nWallet: ${walletNumber}\n${err.message}`);
  }
});

console.log('VKAP Mix Bot started');
