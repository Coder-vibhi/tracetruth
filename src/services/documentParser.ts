import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedDocumentText, ExtractedPage, DocumentType } from '../types/investigation';

// Polyfill Promise.try for pdfjs-dist in Node.js environment if needed
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: Function, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

if (typeof window !== 'undefined' && pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Reusable document parsing service to extract actual text and page numbers from PDF and TXT files.
 * Links extracted results to document ID and investigation ID.
 * Shows OCR Pending status for PNG/JPEG images without pretending images were parsed.
 */
export async function extractDocumentText(
  id: string,
  investigationId: string,
  file: File,
  fileType: DocumentType
): Promise<ExtractedDocumentText> {
  const extractedAt = new Date().toISOString();

  // 1. Handle PNG / JPEG Image Files -> OCR Pending
  if (fileType === 'png' || fileType === 'jpeg') {
    return {
      id,
      investigationId,
      fileName: file.name,
      fileType,
      status: 'ocr_pending',
      fullText: '',
      pages: [],
      errorMessage: 'OCR Pending — PNG and JPEG image files require OCR processing, which is not enabled yet.',
      extractedAt,
    };
  }

  // 2. Handle TXT Files -> Read Actual Text
  if (fileType === 'txt') {
    try {
      const text = await file.text();
      const trimmed = text.trim();

      if (!trimmed) {
        return {
          id,
          investigationId,
          fileName: file.name,
          fileType,
          status: 'empty',
          fullText: '',
          pages: [],
          errorMessage: 'File is empty and contains no readable text.',
          extractedAt,
        };
      }

      return {
        id,
        investigationId,
        fileName: file.name,
        fileType,
        status: 'success',
        fullText: text,
        pages: [{ pageNumber: 1, text }],
        extractedAt,
      };
    } catch (err) {
      return {
        id,
        investigationId,
        fileName: file.name,
        fileType,
        status: 'error',
        fullText: '',
        pages: [],
        errorMessage: 'Unable to read text file contents.',
        extractedAt,
      };
    }
  }

  // 3. Handle PDF Files -> Parse Actual PDF Text & Preserve Page Numbers
  if (fileType === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      if (pdfDoc.numPages === 0) {
        return {
          id,
          investigationId,
          fileName: file.name,
          fileType,
          status: 'empty',
          fullText: '',
          pages: [],
          errorMessage: 'PDF file has 0 pages.',
          extractedAt,
        };
      }

      const pages: ExtractedPage[] = [];
      const fullTextParts: string[] = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageItems = textContent.items
          .map((item: any) => item.str || '')
          .filter(Boolean);
        
        const pageText = pageItems.join(' ').replace(/\s+/g, ' ').trim();

        pages.push({
          pageNumber: pageNum,
          text: pageText,
        });

        if (pageText) {
          fullTextParts.push(`--- Page ${pageNum} ---\n${pageText}`);
        }
      }

      const combinedFullText = fullTextParts.join('\n\n');

      if (!combinedFullText.trim()) {
        return {
          id,
          investigationId,
          fileName: file.name,
          fileType,
          status: 'empty',
          fullText: '',
          pages,
          errorMessage: 'PDF contains no selectable text (document may be a scanned image).',
          extractedAt,
        };
      }

      return {
        id,
        investigationId,
        fileName: file.name,
        fileType,
        status: 'success',
        fullText: combinedFullText,
        pages,
        extractedAt,
      };
    } catch (err: any) {
      console.error('PDF Extraction Error:', err);
      return {
        id,
        investigationId,
        fileName: file.name,
        fileType,
        status: 'error',
        fullText: '',
        pages: [],
        errorMessage: 'Unable to parse text from PDF file.',
        extractedAt,
      };
    }
  }

  return {
    id,
    investigationId,
    fileName: file.name,
    fileType,
    status: 'unsupported',
    fullText: '',
    pages: [],
    errorMessage: 'Unsupported document type.',
    extractedAt,
  };
}
