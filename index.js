require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;

if (!telegramToken) {
  console.error('TELEGRAM_BOT_TOKEN missing');
  process.exit(1);
}

if (!openaiKey) {
  console.error('OPENAI_API_KEY missing');
  process.exit(1);
}

const bot = new TelegramBot(telegramToken, {
  polling: true
});

const openai = new OpenAI({
  apiKey: openaiKey
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    '🚀 VKAP Alpha AI online.\nAsk me anything about crypto, trading, meme coins, Web3.'
  );
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text === '/start') return;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are VKAP Alpha AI, a crypto assistant specialized in crypto, meme coins, trading and Web3.'
        },
        {
          role: 'user',
          content: msg.text
        }
      ],
      max_tokens: 300
    });

    bot.sendMessage(msg.chat.id, response.choices[0].message.content);

  } catch (error) {
    console.error(error);
    bot.sendMessage(msg.chat.id, `Error: ${error.message}`);
  }
});

console.log('VKAP Alpha AI started');
