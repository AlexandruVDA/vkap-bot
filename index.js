require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN missing');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'VKap bot online 🚀');
});

bot.on('message', (msg) => {
  if (msg.text && msg.text !== '/start') {
    bot.sendMessage(msg.chat.id, `Ai scris: ${msg.text}`);
  }
});

console.log('Telegram bot started');
