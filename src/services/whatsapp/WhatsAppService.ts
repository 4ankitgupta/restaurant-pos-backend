import prisma from "../../db/index.js";
import { TwilioProvider } from "./providers/TwilioProvider.js";
import { ApiError } from "../../utils/ApiError.js";
import { decrypt } from "../../utils/cryptoService.js";
import { randomUUID } from "crypto";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class WhatsAppService {
  /**
   * Send bill via WhatsApp
   * @param restaurantId - Restaurant ID
   * @param orderId - Order ID
   * @param customerPhone - Customer's WhatsApp number (must include country code like +91xxxxxxxxxx)
   * @param origin - Base URL of the application (e.g., https://app.rasoitrack.com)
   * @returns Result with success status and remaining credits
   */
  async sendBill(
    restaurantId: string,
    orderId: string,
    customerPhone: string,
    origin: string
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

    // 2. Generate Secure Token and Set Expiry (7 days)
    const billAccessToken = randomUUID();
    const billTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 3. Update Order with Token and Expiry
    await prisma.order.update({
      where: { id: orderId, restaurantId },
      data: {
        billAccessToken,
        billTokenExpiresAt,
      },
    });

    // 4. Construct Public Bill Link
    const billLink = `${origin}/public/bill/${billAccessToken}`;

    let provider;

    // 5. Determine Strategy (Platform vs Custom)
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
      const config = meta.providerConfig as TwilioConfig | null;
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

    // 6. Send Message
    const message = `Namaste! Thank you for dining with us. Click here to view your bill: ${billLink}`;
    await provider.sendMessage(customerPhone, message);

    // 7. Post-Send Logic (Decrement Credits)
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
