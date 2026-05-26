import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

const VKAP_MINT = "8YPfddKpUzPhdyKw6UpdMFnD7yqqft2D8fEcFBeKpump";
const VKAP_BUY_LINK = `https://pump.fun/coin/${VKAP_MINT}`;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are VKAP AI, official assistant for VKAP.
Keep answers short.
If user writes Romanian, answer Romanian.
If user writes German, answer German.
Otherwise answer English.
Never give financial advice.
`;

async function send(chatId, text) {
  await bot.sendMessage(chatId, text, {
    disable_web_page_preview: true,
  });
}

bot.onText(/^\/start$/, async (msg) => {
  await send(
    msg.chat.id,
    `👋 Welcome to VKAP AI

Contract:
${VKAP_MINT}

Commands:
/contract
/buy
/skills`
  );
});

bot.onText(/^\/contract$/, async (msg) => {
  await send(
    msg.chat.id,
    `Official VKAP Contract:

${VKAP_MINT}`
  );
});

bot.onText(/^\/buy$/, async (msg) => {
  await send(
    msg.chat.id,
    `Buy VKAP:

${VKAP_BUY_LINK}`
  );
});

bot.onText(/^\/skills$/, async (msg) => {
  await send(
    msg.chat.id,
    `VKAP AI Skills:
• Token info
• Crypto Q&A
• Community help`
  );
});

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const text = msg.text.trim();

  if (text.startsWith("/")) return;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 200,
    });

    await send(
      msg.chat.id,
      response.choices[0]?.message?.content || "VKAP AI online."
    );
  } catch (err) {
    console.error(err);
    await send(msg.chat.id, "Temporary error.");
  }
});

console.log("VKAP bot running");
