const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text content from uploaded files
 */
async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === '.pdf') {
            return await extractFromPDF(filePath);
        } else if (ext === '.docx' || ext === '.doc') {
            return await extractFromDocx(filePath);
        } else if (ext === '.txt') {
            return await extractFromTxt(filePath);
        } else {
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error extracting text from file:', error);
        throw error;
    }
}

/**
 * Extract text from PDF
 */
async function extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

/**
 * Extract text from DOCX
 */
async function extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

/**
 * Extract text from TXT
 */
async function extractFromTxt(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
    extractTextFromFile
};
