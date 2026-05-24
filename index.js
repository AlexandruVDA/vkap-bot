require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'VKAP Alpha AI online 🚀 Ask me anything.');
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text === '/start') return;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are VKAP Alpha AI, a crypto assistant focused on crypto, trading, meme coins and Web3.'
        },
        {
          role: 'user',
          content: msg.text
        }
      ]
    });

    bot.sendMessage(msg.chat.id, response.choices[0].message.content);
  } catch (error) {
    console.log(error);
    bot.sendMessage(msg.chat.id, 'AI error.');
  }
});
