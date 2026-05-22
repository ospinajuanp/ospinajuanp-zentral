import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IPhotoData } from '@/lib/models/transfercheck-log';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const EXTRACTION_PROMPT = `Extrae de esta imagen de comprobante de transferencia los siguientes datos en formato JSON estricto:
{
  "monto": number (solo el número, sin símbolos ni comas),
  "referencia": string (número de referencia de la transferencia),
  "fecha": string (fecha en formato YYYY-MM-DD)
}

Si no puedes identificar algún campo, usa null.
Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

export interface ExtractionResult {
  success: boolean;
  data?: IPhotoData;
  error?: string;
}

export async function extractTransferData(imageBuffer: Buffer, mimeType = 'image/jpeg'): Promise<ExtractionResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY not configured' };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      { text: EXTRACTION_PROMPT },
      {
        inlineData: {
          mimeType,
          data: imageBuffer.toString('base64'),
        },
      },
    ]);

    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'No se pudo extraer JSON de la respuesta' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.monto === null || parsed.referencia === null) {
      return { success: false, error: 'No se pudieron identificar el monto y/o la referencia en la imagen' };
    }

    return {
      success: true,
      data: {
        monto: Number(parsed.monto),
        referencia: String(parsed.referencia).trim(),
        fecha: parsed.fecha || new Date().toISOString().split('T')[0],
      },
    };
  } catch (error) {
    return { success: false, error: `Error al procesar la imagen: ${error}` };
  }
}
