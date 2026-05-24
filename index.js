require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const VKAP_MINT = process.env.VKAP_MINT;

const WALLETS = {
  1: process.env.PUMP_KEY_1,
  2: process.env.PUMP_KEY_2,
  3: process.env.PUMP_KEY_3
};

const MAX_BUY_SOL = 0.02;

async function buyFromWallet(walletNumber, amount) {
  const apiKey = WALLETS[walletNumber];

  if (!apiKey) {
    throw new Error(`Wallet ${walletNumber} API key missing`);
  }

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

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'VKAP Treasury Bot online ✅\n\nCommands:\n/wallets\n/buy_wallet 1 0.003\n/buy_wallet 2 0.003\n/buy_wallet 3 0.003\n/status'
  );
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Treasury bot online ✅\nMint: ${VKAP_MINT}\nMax manual buy: ${MAX_BUY_SOL} SOL`
  );
});

bot.onText(/\/wallets/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Wallets loaded:\n1: ${WALLETS[1] ? '✅' : '❌'}\n2: ${WALLETS[2] ? '✅' : '❌'}\n3: ${WALLETS[3] ? '✅' : '❌'}`
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
    return bot.sendMessage(chatId, 'Use: /buy_wallet 1 0.003');
  }

  if (amount > MAX_BUY_SOL) {
    return bot.sendMessage(chatId, `Max buy is ${MAX_BUY_SOL} SOL`);
  }

  try {
    const result = await buyFromWallet(walletNumber, amount);
    bot.sendMessage(chatId, `Buy sent ✅\nWallet: ${walletNumber}\nAmount: ${amount} SOL\n${JSON.stringify(result)}`);
  } catch (err) {
    bot.sendMessage(chatId, `Buy failed ❌\nWallet: ${walletNumber}\nError: ${err.message}`);
  }
});

console.log('VKAP Treasury Bot started');
