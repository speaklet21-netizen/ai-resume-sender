declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in browser');
  }

  // Ensure PDF.js is loaded
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) {
    throw new Error('PDF.js library is not yet loaded. Please try again in a moment or paste text.');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageStrings = content.items
        .map((item: any) => item.str || '')
        .filter(Boolean);
      fullText += pageStrings.join(' ') + '\n';
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
      throw new Error('Could not extract text from this PDF. It may be an image scan. Please paste text instead.');
    }
    return trimmed;
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    throw new Error(error.message || 'Failed to parse PDF file');
  }
}
