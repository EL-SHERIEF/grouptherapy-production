export type EmailServiceSettings = {
  service: string;
  apiUrl: string;
  fromEmail: string;
  senderName: string;
  apiKeyLast4: string;
  hasApiKey: boolean;
};

function legacyDisabled(): never {
  throw new Error("Legacy email service settings have been replaced by Sender Profiles.");
}

export async function fetchEmailServiceSettings(): Promise<EmailServiceSettings> {
  legacyDisabled();
}

export async function getEmailServiceSettingsForSending(): Promise<never> {
  legacyDisabled();
}

export async function updateEmailServiceSettings(): Promise<EmailServiceSettings> {
  legacyDisabled();
}
