import prisma from "../../db/index.js";
import { TwilioProvider } from "./providers/TwilioProvider.js";
import { ApiError } from "../../utils/ApiError.js";
import { decrypt } from "../../utils/cryptoService.js";

export class WhatsAppService {
  async sendBill(
    restaurantId: string,
    orderId: string,
    customerPhone: string,
    billLink: string
  ) {
    // 1. Fetch Configuration
    const meta = await prisma.restaurantMetaData.findUnique({
      where: { restaurantId },
    });

    if (!meta || !meta.whatsappEnabled) {
      throw new ApiError(
        400,
        "WhatsApp messaging is disabled for this restaurant."
      );
    }

    let provider;

    // 2. Determine Strategy (Platform vs Custom)
    if (meta.whatsappProvider === "PLATFORM") {
      // A. Check Credits
      if (meta.messageCredits <= 0) {
        throw new ApiError(
          402,
          "Insufficient WhatsApp credits. Please contact support."
        );
      }

      // B. Validate Platform Env Variables
      if (
        !process.env.PLATFORM_TWILIO_SID ||
        !process.env.PLATFORM_TWILIO_TOKEN ||
        !process.env.PLATFORM_TWILIO_NUMBER
      ) {
        throw new ApiError(
          500,
          "Platform WhatsApp configuration is not set. Contact administrator."
        );
      }

      // C. Initialize Provider with Platform Env Variables
      provider = new TwilioProvider({
        accountSid: process.env.PLATFORM_TWILIO_SID,
        authToken: process.env.PLATFORM_TWILIO_TOKEN,
        fromNumber: process.env.PLATFORM_TWILIO_NUMBER,
      });
    } else {
      // C. Use Custom Credentials (with decryption)
      const config = meta.providerConfig as any;
      if (!config?.accountSid || !config?.authToken) {
        throw new ApiError(
          500,
          "Restaurant WhatsApp configuration is missing."
        );
      }

      // Decrypt the auth token
      let decryptedAuthToken: string;
      try {
        decryptedAuthToken = decrypt(config.authToken);
      } catch (error) {
        throw new ApiError(500, "Failed to decrypt WhatsApp credentials.");
      }

      provider = new TwilioProvider({
        accountSid: config.accountSid,
        authToken: decryptedAuthToken,
        fromNumber: config.fromNumber,
      });
    }

    // 3. Send Message
    const message = `Namaste! Thank you for dining at Rasoi Track. Click here to view your bill: ${billLink}`;
    await provider.sendMessage(customerPhone, message);

    // 4. Post-Send Logic (Decrement Credits)
    await prisma.$transaction(async (tx) => {
      // Update Order
      await tx.order.update({
        where: { id: orderId },
        data: { whatsappSent: true, whatsappSentAt: new Date() },
      });

      // Decrement Credit ONLY if using Platform
      if (meta.whatsappProvider === "PLATFORM") {
        await tx.restaurantMetaData.update({
          where: { restaurantId },
          data: { messageCredits: { decrement: 1 } },
        });
      }
    });

    return {
      success: true,
      creditsRemaining:
        meta.whatsappProvider === "PLATFORM" ? meta.messageCredits - 1 : null,
    };
  }
}
