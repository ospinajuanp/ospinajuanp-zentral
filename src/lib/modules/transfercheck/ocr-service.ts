import type { ExtractionResult } from './ai-service';

const OCR_API_URL = 'https://api.ocr.space/parse/image';

const MONTHS_ES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
};

function parseMonto(text: string): number | null {
  const montoLabels = ['monto', 'valor', 'total', 'recibiste', 'enviaste', 'recibido', 'enviado'];

  for (const label of montoLabels) {
    const pattern = new RegExp(
      `${label}[^\\d$]*?(?:\\$\\s*|COP\\s*)?([\\d]{1,3}(?:[.,]\\d{3})*(?:[,.]\\d{1,2})?)`,
      'i'
    );
    const match = text.match(pattern);
    if (match) return parseAmount(match[1]);
  }

  const dollarMatch = text.match(/(?:\$\s*|COP\s+)([\d]{1,3}(?:[.,]\d{3})*(?:[,.]\d{1,2})?)/i);
  if (dollarMatch) return parseAmount(dollarMatch[1]);

  const genericMatch = text.match(/[\d]{1,3}(?:\.\d{3}){1,3}(?:,\d{1,2})?/);
  if (genericMatch) return parseAmount(genericMatch[0]);

  return null;
}

function parseAmount(raw: string): number {
  const cleaned = raw.trim();

  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastDot > lastComma) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    return Number(cleaned.replace(/,/g, ''));
  }

  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2 && parts[0].length <= 3) {
      return Number(cleaned.replace(',', '.'));
    }
    if (parts.length === 2 && parts[1].length === 3) {
      return Number(cleaned.replace(',', ''));
    }
    if (cleaned.match(/^\d{1,3},\d{3}(,\d{3})*$/)) {
      return Number(cleaned.replace(/,/g, ''));
    }
    return Number(cleaned.replace(',', '.'));
  }

  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2 && parts[0].length <= 3) {
      return Number(cleaned);
    }
    if (parts.length > 2) {
      return Number(cleaned.replace(/\./g, ''));
    }
    if (parts.length === 2 && parts[1].length === 3) {
      return Number(cleaned.replace('.', ''));
    }
  }

  return Number(cleaned);
}

function parseReferencia(text: string): string | null {
  const refLabels = ['referencia', 'ref\\b', 'nro\\.?\\s*ref', 'n[uú]mero\\s+de\\s+ref', 'comprobante', '#\\s*ref'];

  for (const label of refLabels) {
    const pattern = new RegExp(`${label}[^\\d]*?([\\d]{4,20})`, 'i');
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  const hashMatch = text.match(/#\s*(\d{4,20})/);
  if (hashMatch) return hashMatch[1];

  return null;
}

function parseFecha(text: string): string | null {
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    if (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31) return `${y}-${m}-${d}`;
  }

  const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const [, d1, d2, y] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    if (+d1 >= 1 && +d1 <= 31 && +d2 >= 1 && +d2 <= 12) return `${year}-${d2.padStart(2, '0')}-${d1.padStart(2, '0')}`;
    if (+d2 >= 1 && +d2 <= 31 && +d1 >= 1 && +d1 <= 12) return `${year}-${d1.padStart(2, '0')}-${d2.padStart(2, '0')}`;
  }

  const dashMatch = text.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (dashMatch) {
    const [, d1, d2, y] = dashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    if (+d1 >= 1 && +d1 <= 31 && +d2 >= 1 && +d2 <= 12) return `${year}-${d2.padStart(2, '0')}-${d1.padStart(2, '0')}`;
  }

  for (const [monthName, monthNum] of Object.entries(MONTHS_ES)) {
    const textMatch = text.match(new RegExp(`(\\d{1,2})\\s+(?:de\\s+)?${monthName}\\s+(?:de\\s+)?(\\d{2,4})`, 'i'));
    if (textMatch) {
      const [, d, y] = textMatch;
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(+d).padStart(2, '0')}`;
    }
  }

  return null;
}

export async function extractWithOcr(imageBuffer: Buffer, mimeType = 'image/jpeg'): Promise<ExtractionResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';

  try {
    const formData = new URLSearchParams();
    formData.append('base64Image', `data:${mimeType};base64,${imageBuffer.toString('base64')}`);
    formData.append('language', 'spa');
    formData.append('isTable', 'true');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('detectOrientation', 'true');

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 403) {
        throw new Error('QUOTA_EXHAUSTED');
      }
      throw new Error(`OCR API responded with status ${response.status}`);
    }

    const json = await response.json();

    if (json.IsErroredOnProcessing || json.OCRExitCode !== 1) {
      const errMsg = json.ErrorMessage || 'Error desconocido de OCR';
      throw new Error(`OCR processing error: ${errMsg}`);
    }

    const parsedText = json.ParsedResults?.[0]?.ParsedText;
    if (!parsedText || parsedText.trim().length === 0) {
      return { success: false, error: 'No se detectó texto en la imagen' };
    }

    const text = parsedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const monto = parseMonto(text);
    const referencia = parseReferencia(text);
    const fecha = parseFecha(text);

    if (monto === null || referencia === null) {
      const missing = [
        monto === null ? 'monto' : null,
        referencia === null ? 'referencia' : null,
      ].filter(Boolean).join(' y ');

      return {
        success: false,
        error: `No se pudo identificar ${missing} en la imagen. Verifica que la foto sea clara y muestre los datos completos.`,
      };
    }

    return {
      success: true,
      data: {
        monto,
        referencia,
        fecha: fecha || new Date().toISOString().split('T')[0],
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'QUOTA_EXHAUSTED') {
      throw error;
    }

    return {
      success: false,
      error: `Error al procesar la imagen con OCR: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
