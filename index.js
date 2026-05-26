import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

const VKAP_MINT = "8YPfddKpUzPhdyKw6UpdMFnD7yqqft2D8fEcFBeKpump";
const VKAP_BUY_LINK = `https://pump.fun/coin/${VKAP_MINT}`;
const SKILLS_LINK =
  "https://raw.githubusercontent.com/pump-fun/pump-fun-skills/refs/heads/main/tokenized-agents/SKILL.md";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are VKAP AI, the official Telegram assistant for VILLACH KAPITAL / VKAP.

Token:
Name: VILLACH KAPITAL
Ticker: VKAP
Network: Solana
Mint address: ${VKAP_MINT}
Buy link: ${VKAP_BUY_LINK}

Rules:
- Keep replies short, clear, and community-friendly.
- Never promise profit, pumps, listings, or guaranteed returns.
- Never give financial advice.
- Always remind users to verify the official contract before buying.
- If asked where to buy, give the official Pump.fun link.
- If asked about ads, AMA, influencers, marketing, or partnerships, ask for media kit, pricing, engagement stats, audience geo, and previous campaign results.
- If user writes Romanian, answer Romanian.
- If user writes German, answer German.
- Otherwise answer English.
`;

function menu() {
  return `🤖 VKAP AI Commands

/start - Start bot
/skills - Show agent skills
/contract - Official contract
/buy - Buy VKAP
/community - Community info
/partnership - Ads / AMA / promo requests`;
}

async function send(chatId, text) {
  await bot.sendMessage(chatId, text, {
    disable_web_page_preview: true,
  });
}

bot.onText(/^\/start$/, async (msg) => {
  await send(
    msg.chat.id,
    `👋 Welcome to VKAP AI.

VILLACH KAPITAL / VKAP
Network: Solana
Contract:
${VKAP_MINT}

${menu()}`
  );
});

bot.onText(/^\/skills$/, async (msg) => {
  await send(
    msg.chat.id,
    `VKAP AI Skills:

• Token info
• Community help
• Crypto Q&A
• Contract verification
• Buy guidance
• Partnership requests

Tokenized Agent Skill:
${SKILLS_LINK}`
  );
});

bot.onText(/^\/contract$/, async (msg) => {
  await send(
    msg.chat.id,
    `📄 Official VKAP Contract:

${VKAP_MINT}

Always verify the contract before buying.`
  );
});

bot.onText(/^\/buy$/, async (msg) => {
  await send(
    msg.chat.id,
    `🚀 Buy VKAP:

${VKAP_BUY_LINK}

Official contract:
${VKAP_MINT}

Always verify the contract before buying.`
  );
});

bot.onText(/^\/community$/, async (msg) => {
  await send(
    msg.chat.id,
    `🔥 Welcome to the VKAP community.

VKAP is built around community, crypto culture, and the Villach Kapital brand.`
  );
});

bot.onText(/^\/partnership$/, async (msg) => {
  await send(
    msg.chat.id,
    `Thanks for reaching out.

Please send:
• Media kit
• Pricing
• Engagement stats
• Audience geo
• Previous campaign results

Our team will review it.`
  );
});

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const text = msg.text.trim();

  // Prevent commands from going to AI
  if (text.startsWith("/")) return;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
      max_tokens: 220,
    });

    const reply = response.choices[0]?.message?.content || "VKAP AI is online.";
    await send(msg.chat.id, reply);
  } catch (error) {
    console.error("OpenAI error:", error);
    await send(msg.chat.id, "⚠️ Temporary error. Try again.");
  }
});

console.log("VKAP AI Telegram bot is running.");
