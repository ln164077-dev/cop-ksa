import { describe, expect, it } from "vitest";

describe("Telegram bot credentials", () => {
  it("accepts the configured bot token", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token, "TELEGRAM_BOT_TOKEN must be configured").toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const body = await response.json() as { ok?: boolean; result?: { is_bot?: boolean } };

    expect(response.ok).toBe(true);
    expect(body.ok).toBe(true);
    expect(body.result?.is_bot).toBe(true);
  }, 15_000);

  it("can access the configured destination chat", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    expect(token).toBeTruthy();
    expect(chatId).toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId ?? "")}`);
    const body = await response.json() as { ok?: boolean };
    expect(response.ok).toBe(true);
    expect(body.ok).toBe(true);
  }, 15_000);
});

// This test intentionally calls Telegram's read-only getMe endpoint only; it never sends a message.
