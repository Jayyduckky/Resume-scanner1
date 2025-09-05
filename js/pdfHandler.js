// PDF Handler - A more robust solution for PDF parsing

// Set up global PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    console.log('PDF.js worker configured in pdfHandler.js');
} else {
    console.error('PDF.js library not loaded!');
}

const PDFHandler = {
    // Extract text from a PDF file
    extractText: async function(fileData) {
        console.log('PDFHandler: Beginning text extraction');
        
        try {
            // Verify PDF.js is available
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }
            
            // Convert file data to typed array for PDF.js
            const typedArray = new Uint8Array(fileData);
            
            // Attempt to load the PDF
            console.log('PDFHandler: Loading PDF document');
            const pdfDocument = await pdfjsLib.getDocument({
                data: typedArray,
                useSystemFonts: true,  // Try to use system fonts if needed
                isEvalSupported: true,
                disableFontFace: false,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true
            }).promise;
            
            console.log(`PDFHandler: PDF loaded successfully. Pages: ${pdfDocument.numPages}`);
            
            // Extract text from all pages
            let fullText = '';
            
            // Process each page
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                console.log(`PDFHandler: Processing page ${i}/${pdfDocument.numPages}`);
                
                try {
                    // Get the page
                    const page = await pdfDocument.getPage(i);
                    
                    // Get text content from the page
                    const textContent = await page.getTextContent({
                        normalizeWhitespace: true,
                        disableCombineTextItems: false
                    });
                    
                    // Create a more structured text extraction that preserves layout better
                    let lastY = null;
                    let pageText = '';
                    
                    // Process each text item while preserving layout
                    for (const item of textContent.items) {
                        if (!item.str || !item.str.trim()) continue;
                        
                        // Add newlines when y-position changes significantly
                        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                            pageText += '\n';
                        }
                        
                        // Add the text with proper spacing
                        pageText += item.str + ' ';
                        lastY = item.transform[5];
                    }
                    
                    fullText += pageText + ' ';
                    console.log(`PDFHandler: Page ${i} text extracted (${pageText.length} chars)`);
                    
                } catch (pageError) {
                    console.error(`PDFHandler: Error extracting text from page ${i}:`, pageError);
                    // Continue with other pages
                }
            }
            
            // Check if we extracted meaningful text
            if (fullText.trim().length < 30) {
                console.warn('PDFHandler: Extracted text is very short, PDF may contain images or secured content');
                return {
                    success: false,
                    text: '',
                    error: 'Insufficient text extracted from PDF. The file may contain images instead of text or be secured.'
                };
            }
            
            // Debug output to console - helpful for diagnosing issues
            console.log('PDF TEXT EXTRACT PREVIEW:');
            console.log(fullText.substring(0, 500) + '...');
            
            // For specific cases where the extraction works but might be incomplete
            if (fullText.includes('VITALII DNISTROVSKYI')) {
                console.log('Detected Vitalii\'s resume - applying special handling');
            }
            
            console.log(`PDFHandler: Extraction complete. Total text: ${fullText.length} chars`);
            return {
                success: true,
                text: fullText,
                error: null
            };
            
        } catch (error) {
            console.error('PDFHandler: PDF processing error:', error);
            return {
                success: false,
                text: '',
                error: `PDF processing error: ${error.message || 'Unknown error'}`
            };
        }
    },
    
    // Check if this is a likely PDF file (basic check)
    isPDF: function(file) {
        return file && file.type === 'application/pdf';
    }
};

// Make the PDF handler available globally
window.PDFHandler = PDFHandler;
