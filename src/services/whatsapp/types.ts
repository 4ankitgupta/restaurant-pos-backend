export interface IWhatsAppProvider {
  sendMessage(to: string, content: string, mediaUrl?: string): Promise<boolean>;
}

export interface WhatsAppConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
}
