import { extractWithOcr } from './ocr-service';
import { extractTransferData as extractWithGemini, type ExtractionResult } from './ai-service';

export type { ExtractionResult };

export async function extractTransferData(imageBuffer: Buffer, mimeType = 'image/jpeg'): Promise<ExtractionResult> {

  try {
    const ocrResult = await extractWithOcr(imageBuffer, mimeType);
    if (ocrResult.success) return ocrResult;
  } catch {
    //
  }

  try {
    const geminiResult = await extractWithGemini(imageBuffer, mimeType);
    if (geminiResult.success) return geminiResult;
  } catch {
    //
  }

  return {
    success: false,
    error:
      'Estamos experimentando un alto volumen de tráfico. Nuestro servicio de extracción de datos no está disponible en este momento. Por favor, reintenta en unos minutos.',
  };
}
