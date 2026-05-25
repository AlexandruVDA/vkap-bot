Unde apas
Și aici
Ba frate de 2 zile ma pui sa schimb pe aici și nu merge am.20 de încercări puncte un pic pe treaba 
Unde?
Nu pot apasa save
Deci eu o iau razna frate 2 zile nu reușim.sa pornim futui mama masi nu prea te pricepi și te plătesc la pro😱🥺
Unde?
Unde?
Pai tot asa sta
Unde man
Nu pot sa apas generate domain
Dc sunt 3 aici
Primu a mers chiar repede daca te uiti
??
Fal tu aici și eu îl copiez și îl pun complet
Restart sau redeplox
Pai cand ii dau redeploy pornește jos unu nou
Care e faza cu x asta?
?
?
Node asta se tot învârte de 8 min
Aici se tot invarte
A apărut asta
?
Variables noua sau aici?
?
?
?

Exact 👍

Ai acum practic:

4 wallet-uri separate

main auto wallet
wallet 1
wallet 2
wallet 3

Fiecare:

cumpără separat
vinde separat
ține propriul SOL separat

Comenzi utile acum:

Pornit auto:

/start_auto

Oprit auto:

/stop_auto

Status:

/status

Manual buy:

/buy_main 0.01
/buy_wallet 1 0.01
/buy_wallet 2 0.01
/buy_wallet 3 0.01

Manual sell:

/sell_main 0.01
/sell_wallet 1 0.01
/sell_wallet 2 0.01
/sell_wallet 3 0.01

Dacă vrei next, pot să-ți fac:
/balances → să vezi live câți SOL are fiecare wallet direct din Telegram.

Ok

Perfect. Setup-ul e clar acum. ✅

Dacă ceva nu merge, verifici rapid:

Railway logs

MAIN AUTO BUY:

= auto buy merge

sau:

ERROR

Telegram control:

/status

Dacă vrei mai târziu:

/balances
sweep all SOL către wallet principal
emergency /sell_all
random timer
profit tracker / PnL

spui și continuăm.

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
