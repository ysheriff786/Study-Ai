import { FileType } from './types';

/**
 * Detect the academic material format from filename and MIME type.
 */
export function detectFileType(fileName: string, mimeType?: string): FileType {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (lower.endsWith('.pdf') || mime.includes('pdf')) {
    return 'pdf';
  }
  if (
    lower.endsWith('.pptx') ||
    lower.endsWith('.ppt') ||
    lower.endsWith('.key') ||
    lower.endsWith('.odp') ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return 'pptx';
  }
  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.vtt') ||
    lower.endsWith('.srt') ||
    mime.includes('video') ||
    mime.includes('audio')
  ) {
    return 'video';
  }
  return 'notes';
}

/**
 * Formats byte size into human readable string (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export interface ExtractedFileResult {
  fileName: string;
  fileSizeFormatted: string;
  detectedType: FileType;
  rawText: string;
  base64?: string;
  mimeType: string;
}

/**
 * Extract text and metadata from a local system file.
 */
export async function extractFileContent(file: File): Promise<ExtractedFileResult> {
  const fileName = file.name;
  const mimeType = file.type || 'application/octet-stream';
  const detectedType = detectFileType(fileName, mimeType);
  const fileSizeFormatted = formatFileSize(file.size);

  // 1. Plain text, markdown, transcripts, json, csv
  const isPlainText =
    mimeType.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.markdown') ||
    fileName.endsWith('.vtt') ||
    fileName.endsWith('.srt') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.py') ||
    fileName.endsWith('.ts') ||
    fileName.endsWith('.js') ||
    fileName.endsWith('.tex');

  if (isPlainText) {
    const text = await file.text();
    return {
      fileName,
      fileSizeFormatted,
      detectedType,
      rawText: text.trim(),
      mimeType: mimeType || 'text/plain',
    };
  }

  // 2. Binary files (PDF, PPTX, etc.)
  const arrayBuffer = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);

  let extractedText = '';

  if (detectedType === 'pdf') {
    // Attempt fast stream text extraction from PDF
    extractedText = extractTextFromPdfBuffer(arrayBuffer);
    if (!extractedText || extractedText.length < 50) {
      extractedText = `[Attached PDF Document: "${fileName}" · Size: ${fileSizeFormatted}]\nThis academic PDF has been loaded from your system. Gemini multimodal processing will parse diagrams, formulas, pages, and key concepts during indexing.`;
    }
  } else if (detectedType === 'pptx') {
    // Attempt slide text extraction
    extractedText = extractAsciiStrings(arrayBuffer);
    if (!extractedText || extractedText.length < 50) {
      extractedText = `[Attached Slide Deck: "${fileName}" · Size: ${fileSizeFormatted}]\nLecture slide deck loaded from your local system. Gemini multimodal pipeline will extract slides and generate concept anchors.`;
    }
  } else if (detectedType === 'video') {
    extractedText = `[Attached Video/Media Recording: "${fileName}" · Size: ${fileSizeFormatted}]\nVideo recording loaded from your local system. Gemini pipeline will structure timestamped transcripts and conceptual summaries.`;
  } else {
    // General fallback
    const strings = extractAsciiStrings(arrayBuffer);
    extractedText =
      strings.length > 50
        ? strings
        : `[Attached Course Document: "${fileName}" · Size: ${fileSizeFormatted}]\nDocument material loaded from your local system. Ready for indexing.`;
  }

  return {
    fileName,
    fileSizeFormatted,
    detectedType,
    rawText: extractedText.trim(),
    base64,
    mimeType: file.type || (detectedType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  // Process in chunks to prevent call-stack overflow on large files
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Basic PDF text stream extractor for client-side quick preview.
 * Scans for standard PDF text operators (Tj, TJ) and stream content.
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(buffer);
    const decoder = new TextDecoder('latin1');
    const pdfStr = decoder.decode(uint8);

    const textPieces: string[] = [];

    // Match text within parentheses before Tj or TJ
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(pdfStr)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 1) {
        textPieces.push(clean);
      }
    }

    // Match bracketed TJ arrays: [(text) 20 (more)] TJ
    const arrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = arrayRegex.exec(pdfStr)) !== null) {
      const inner = match[1];
      const itemRegex = /\(([^)]+)\)/g;
      let itemMatch: RegExpExecArray | null;
      const joined: string[] = [];
      while ((itemMatch = itemRegex.exec(inner)) !== null) {
        const clean = itemMatch[1].replace(/\\([()\\])/g, '$1').trim();
        if (clean) joined.push(clean);
      }
      if (joined.length > 0) {
        textPieces.push(joined.join(' '));
      }
    }

    if (textPieces.length > 5) {
      // Group pieces into coherent paragraphs
      return textPieces
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/([.?!])\s+/g, '$1\n\n');
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Extract printable ASCII sequences from binary streams.
 */
function extractAsciiStrings(buffer: ArrayBuffer, minLen = 4): string {
  try {
    const bytes = new Uint8Array(buffer);
    let cur = '';
    const results: string[] = [];

    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      // Printable ASCII 32 to 126, plus newline
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        cur += String.fromCharCode(b);
      } else {
        if (cur.length >= minLen) {
          // Filter out obvious binary garbage
          const trimmed = cur.trim();
          if (trimmed.length >= minLen && /[a-zA-Z]{3,}/.test(trimmed)) {
            results.push(trimmed);
          }
        }
        cur = '';
      }
    }

    return results.slice(0, 100).join(' ');
  } catch {
    return '';
  }
}
