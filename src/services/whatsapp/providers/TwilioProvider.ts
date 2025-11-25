import twilio from "twilio";
import type { IWhatsAppProvider, WhatsAppConfig } from "../types.js";

export class TwilioProvider implements IWhatsAppProvider {
  private client: any;
  private from: string;

  constructor(config: WhatsAppConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.from = config.fromNumber;
  }

  async sendMessage(to: string, content: string): Promise<boolean> {
    try {
      // Ensure number has country code, e.g., +91
      const formattedTo = to.startsWith("+") ? to : `+91${to}`;

      await this.client.messages.create({
        body: content,
        from: `whatsapp:${this.from}`,
        to: `whatsapp:${formattedTo}`,
      });
      return true;
    } catch (error) {
      console.error("Twilio Send Error:", error);
      throw new Error("Failed to send WhatsApp message via Twilio");
    }
  }
}
