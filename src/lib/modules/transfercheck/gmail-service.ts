import { google } from 'googleapis';
import dbConnect from '@/lib/db/mongoose';
import { WorkspaceSettings } from '@/lib/models/workspace-settings';
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

export async function getGmailStatus(workspaceId: string): Promise<{ connected: boolean }> {
  await dbConnect();
  const settings = await WorkspaceSettings.findOne({ workspace: workspaceId });
  return { connected: settings?.gmailConnected ?? false };
}

export async function getRefreshToken(workspaceId: string): Promise<string | null> {
  await dbConnect();
  const settings = await WorkspaceSettings.findOne({ workspace: workspaceId });
  return settings?.gmailRefreshToken ?? null;
}

async function getAuthClientForWorkspace(workspaceId: string) {
  await dbConnect();
  const settings = await WorkspaceSettings.findOne({ workspace: workspaceId });

  if (!settings || !settings.gmailRefreshToken) {
    throw new Error('Gmail no conectado para este workspace');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: settings.gmailRefreshToken });

  const { token } = await oauth2Client.getAccessToken();

  if (settings.gmailAccessToken !== token) {
    const expiry = new Date(Date.now() + 3600 * 1000);
    await WorkspaceSettings.findOneAndUpdate(
      { workspace: workspaceId },
      { gmailAccessToken: token, gmailTokenExpiry: expiry }
    );
  }

  return oauth2Client;
}

function searchAmountVariations(monto: number): string[] {
  const co = monto.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const intl = monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plain = monto.toFixed(2);
  const integer = Math.floor(monto).toString();
  const intlInteger = Math.floor(monto).toLocaleString('en-US');
  const coInteger = Math.floor(monto).toLocaleString('es-CO');

  const results = [
    co,            // 173.000,00
    intl,          // 173,000.00
    plain,         // 173000.00
    integer,       // 173000
    intlInteger,   // 173,000
    coInteger,     // 173.000
  ];

  return [...new Set(results)];
}

export interface GmailSearchResult {
  success: boolean;
  matches: IEmailData[];
  error?: string;
}

export interface DebugEmailResult {
  messageId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyPreview: string;
  matchedAmount: boolean;
  matchedReference: boolean;
  matchedReferenceInBody: boolean;
}

export interface DebugSearchResult {
  success: boolean;
  searchQuery: string;
  amountVariations: string[];
  referenceVariations: string[];
  emails: DebugEmailResult[];
  error?: string;
}

export async function debugSearchTransferEmails(
  photoData: IPhotoData,
  workspaceId: string
): Promise<DebugSearchResult> {
  const amounts = searchAmountVariations(photoData.monto);
  const refs = [
    photoData.referencia,
    photoData.referencia.replace(/\s/g, ''),
    photoData.referencia.replace(/-/g, ''),
    photoData.referencia.replace(/[^0-9]/g, ''),
  ];
  const query = `(${amounts.join(' OR ')}) newer_than:1d`;

  try {
    const auth = await getAuthClientForWorkspace(workspaceId);
    const gmail = google.gmail({ version: 'v1', auth });

    console.log('[debug-gmail] Searching with query:', query);
    console.log('[debug-gmail] Amount variations:', amounts);
    console.log('[debug-gmail] Reference variations:', refs);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    const messages = response.data.messages || [];
    console.log('[debug-gmail] Found', messages.length, 'messages');

    if (messages.length === 0) {
      return {
        success: true,
        searchQuery: query,
        amountVariations: amounts,
        referenceVariations: refs,
        emails: [],
      };
    }

    const emails: DebugEmailResult[] = [];

    for (const msg of messages.slice(0, 10)) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const date = headers.find((h) => h.name === 'Date')?.value || '';
      const snippet = detail.data.snippet || '';

      let bodyText = '';
      if (detail.data.payload?.parts) {
        for (const part of detail.data.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
      } else if (detail.data.payload?.body?.data) {
        bodyText = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf-8');
      }

      const bodyPreview = bodyText.substring(0, 1000);

      let matchedReference = false;
      for (const ref of refs) {
        if (snippet.includes(ref) || subject.includes(ref) || bodyText.includes(ref)) {
          matchedReference = true;
          break;
        }
      }

      let matchedReferenceInBody = false;
      for (const ref of refs) {
        if (bodyText.includes(ref)) {
          matchedReferenceInBody = true;
          break;
        }
      }

      emails.push({
        messageId: msg.id!,
        from,
        subject,
        date,
        snippet,
        bodyPreview,
        matchedAmount: true,
        matchedReference,
        matchedReferenceInBody,
      });
    }

    return {
      success: true,
      searchQuery: query,
      amountVariations: amounts,
      referenceVariations: refs,
      emails,
    };
  } catch (error) {
    console.error('[debug-gmail] Error:', error);
    return {
      success: false,
      searchQuery: query,
      amountVariations: amounts,
      referenceVariations: refs,
      emails: [],
      error: `Error al buscar correos: ${error}`,
    };
  }
}

export async function searchTransferEmails(
  photoData: IPhotoData,
  workspaceId: string
): Promise<GmailSearchResult> {
  try {
    const auth = await getAuthClientForWorkspace(workspaceId);
    const gmail = google.gmail({ version: 'v1', auth });

    const amounts = searchAmountVariations(photoData.monto);
    const query = `(${amounts.join(' OR ')}) newer_than:1d`;

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
    const refs = [
      photoData.referencia,
      photoData.referencia.replace(/\s/g, ''),
      photoData.referencia.replace(/-/g, ''),
      photoData.referencia.replace(/[^0-9]/g, ''),
    ];

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
