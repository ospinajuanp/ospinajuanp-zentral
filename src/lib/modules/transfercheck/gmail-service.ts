import { google } from 'googleapis';
import type { IPhotoData, IEmailData } from '@/lib/models/transfercheck-log';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

function normalizeAmount(amount: number): string {
  return amount.toFixed(2).replace('.', '').replace(',', '');
}

function searchAmountVariations(monto: number): string[] {
  const formatted = monto.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plain = monto.toFixed(2);
  const noDecimals = Math.floor(monto).toString();
  const withComma = plain.replace('.', ',');
  const numeric = normalizeAmount(monto);

  return [...new Set([formatted, plain, noDecimals, withComma, numeric, `$${formatted}`, `$${plain}`])];
}

export interface GmailSearchResult {
  success: boolean;
  matches: IEmailData[];
  error?: string;
}

export async function searchTransferEmails(
  photoData: IPhotoData,
  refreshToken: string
): Promise<GmailSearchResult> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    await oauth2Client.getAccessToken();

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const amounts = searchAmountVariations(photoData.monto);
    const queryParts = amounts.map((a) => a).join(' OR ');
    const query = `(${queryParts}) newer_than:1d`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      return { success: true, matches: [] };
    }

    const matches: IEmailData[] = [];

    const refs = [photoData.referencia, photoData.referencia.replace(/\s/g, ''), photoData.referencia.replace(/-/g, ''), photoData.referencia.replace(/[^0-9]/g, '')];

    for (const msg of messages.slice(0, 10)) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload?.headers || [];
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const date = headers.find((h) => h.name === 'Date')?.value || '';

      const snippet = detail.data.snippet || '';

      let matched = false;
      for (const ref of refs) {
        if (snippet.includes(ref) || subject.includes(ref)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        matches.push({
          from,
          subject,
          date,
          snippet: snippet.substring(0, 200),
          matchedMonto: photoData.monto,
          matchedReferencia: photoData.referencia,
        });
      }
    }

    return { success: true, matches };
  } catch (error) {
    return { success: false, matches: [], error: `Error al buscar correos: ${error}` };
  }
}
