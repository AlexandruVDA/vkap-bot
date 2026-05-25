require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
 const bs58 = require('bs58').default;
const {
  Connection,
  Keypair,
  VersionedTransaction
} = require('@solana/web3.js');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const VKAP_MINT = process.env.VKAP_MINT;
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';

const connection = new Connection(RPC_URL, 'confirmed');

const WALLETS = {
  1: process.env.PUMP_KEY_1,
  2: process.env.PUMP_KEY_2,
  3: process.env.PUMP_KEY_3
};

const MAIN_WALLET_ID = 1;
const MAX_TRADE_SOL = 0.5;

let autoBuyEnabled = true;
const AUTO_BUY_AMOUNT = 0.006;
const AUTO_BUY_INTERVAL = 10 * 60 * 1000;

function getKeypair(privateKey) {
  if (!privateKey) throw new Error('Private key missing');
  return Keypair.fromSecretKey(bs58.decode(privateKey));
}

async function trade(walletId, action, amount) {
  const privateKey = WALLETS[walletId];
  const keypair = getKeypair(privateKey);

  const response = await fetch('https://pumpportal.fun/api/trade-local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      publicKey: keypair.publicKey.toBase58(),
      action: action,
      mint: VKAP_MINT,
      amount: amount,
      denominatedInSol: 'true',
      slippage: 15,
      priorityFee: 0.001,
      pool: 'pump'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const txBuffer = await response.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(txBuffer));

  tx.sign([keypair]);

  const signature = await connection.sendTransaction(tx, {
    skipPreflight: false,
    maxRetries: 5
  });

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

setInterval(async () => {
  if (!autoBuyEnabled) return;

  try {
    const sig = await trade(MAIN_WALLET_ID, 'buy', AUTO_BUY_AMOUNT);
    console.log('AUTO BUY:', sig);
  } catch (err) {
    console.log('AUTO BUY ERROR:', err.message);
  }
}, AUTO_BUY_INTERVAL);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `VKAP Bot online ✅

/status
/wallets
/start_auto
/stop_auto

/buy_wallet 1 0.01
/buy_wallet 2 0.01
/buy_wallet 3 0.01

/sell_wallet 1 0.01
/sell_wallet 2 0.01
/sell_wallet 3 0.01`);
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, `Status ✅
Auto-buy wallet 1: ${autoBuyEnabled ? 'ON' : 'OFF'}
Auto amount: ${AUTO_BUY_AMOUNT} SOL / 10 min
Max trade: ${MAX_TRADE_SOL} SOL`);
});

bot.onText(/\/wallets/, (msg) => {
  bot.sendMessage(msg.chat.id, `Wallets:
1: ${WALLETS[1] ? '✅' : '❌'}
2: ${WALLETS[2] ? '✅' : '❌'}
3: ${WALLETS[3] ? '✅' : '❌'}`);
});

bot.onText(/\/start_auto/, (msg) => {
  autoBuyEnabled = true;
  bot.sendMessage(msg.chat.id, 'Auto-buy ON ✅');
});

bot.onText(/\/stop_auto/, (msg) => {
  autoBuyEnabled = false;
  bot.sendMessage(msg.chat.id, 'Auto-buy OFF 🛑');
});

bot.onText(/\/buy_wallet (\d+) (.+)/, async (msg, match) => {
  const walletId = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletId)) {
    return bot.sendMessage(msg.chat.id, 'Use wallet 1, 2, or 3.');
  }

  if (!amount || amount <= 0 || amount > MAX_TRADE_SOL) {
    return bot.sendMessage(msg.chat.id, `Use: /buy_wallet ${walletId} 0.01\nMax: ${MAX_TRADE_SOL} SOL`);
  }

  try {
    const sig = await trade(walletId, 'buy', amount);
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} buy ✅\nhttps://solscan.io/tx/${sig}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} buy failed ❌\n${err.message}`);
  }
});

bot.onText(/\/sell_wallet (\d+) (.+)/, async (msg, match) => {
  const walletId = Number(match[1]);
  const amount = Number(match[2]);

  if (![1, 2, 3].includes(walletId)) {
    return bot.sendMessage(msg.chat.id, 'Use wallet 1, 2, or 3.');
  }

  if (!amount || amount <= 0 || amount > MAX_TRADE_SOL) {
    return bot.sendMessage(msg.chat.id, `Use: /sell_wallet ${walletId} 0.01\nMax: ${MAX_TRADE_SOL} SOL`);
  }

  try {
    const sig = await trade(walletId, 'sell', amount);
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} sell ✅\nhttps://solscan.io/tx/${sig}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Wallet ${walletId} sell failed ❌\n${err.message}`);
  }
});

console.log('VKAP local signing bot started');
