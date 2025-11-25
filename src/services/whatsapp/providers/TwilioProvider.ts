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
      // Validate that number starts with + (country code required)
      if (!to.startsWith("+")) {
        throw new Error(
          "Phone number must include country code (e.g., +91xxxxxxxxxx, +1xxxxxxxxxx)"
        );
      }

      // Validate minimum length (country code + number)
      if (to.length < 10) {
        throw new Error("Invalid phone number format");
      }

      await this.client.messages.create({
        body: content,
        from: `whatsapp:${this.from}`,
        to: `whatsapp:${to}`,
      });
      return true;
    } catch (error) {
      console.error("Twilio Send Error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to send WhatsApp message: ${error.message}`);
      }
      throw new Error("Failed to send WhatsApp message via Twilio");
    }
  }
}
