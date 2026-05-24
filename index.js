require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PUMP_API_KEY = process.env.PUMPPORTAL_API_KEY;
const VKAP_MINT = process.env.VKAP_MINT;

const MAX_BUY_SOL = 0.02;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'VKAP Alpha AI online 🚀\nCommands: /buy 0.01, /status');
});

bot.onText(/\/status/, (msg) => {
  bot.sendMessage(msg.chat.id, `Bot online ✅\nMint: ${VKAP_MINT}\nMax buy: ${MAX_BUY_SOL} SOL`);
});

bot.onText(/\/buy (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = Number(match[1]);

  if (!amount || amount <= 0) {
    return bot.sendMessage(chatId, 'Use: /buy 0.01');
  }

  if (amount > MAX_BUY_SOL) {
    return bot.sendMessage(chatId, `Max buy is ${MAX_BUY_SOL} SOL.`);
  }

  try {
    const res = await fetch(`https://pumpportal.fun/api/trade?api-key=${PUMP_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'buy',
        mint: VKAP_MINT,
        amount: amount,
        denominatedInSol: 'true',
        slippage: 10,
        priorityFee: 0.00005,
        pool: 'pump'
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return bot.sendMessage(chatId, `Buy failed: ${JSON.stringify(data)}`);
    }

    bot.sendMessage(chatId, `Buy sent ✅\n${JSON.stringify(data)}`);
  } catch (err) {
    bot.sendMessage(chatId, `Buy error: ${err.message}`);
  }
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are VKAP Alpha AI, a crypto assistant.' },
        { role: 'user', content: msg.text }
      ],
      max_tokens: 300
    });

    bot.sendMessage(msg.chat.id, completion.choices[0].message.content);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `AI error: ${err.message}`);
  }
});

console.log('VKAP Alpha bot started');
