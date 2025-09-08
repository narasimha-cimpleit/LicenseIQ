import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface FileUploadResult {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class FileService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.maxFileSize = 1024 * 1024 * 1024; // 1GB
    this.allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  validateFile(file: { size: number; mimetype: string; originalname: string }): FileValidationResult {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024 * 1024)}GB`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} is not supported. Allowed types: PDF, DOC, DOCX, TXT`
      };
    }

    // Check filename
    if (!file.originalname || file.originalname.length > 255) {
      return {
        isValid: false,
        error: 'Invalid filename'
      };
    }

    return { isValid: true };
  }

  async saveFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<FileUploadResult> {
    const fileExtension = path.extname(originalName);
    const fileName = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    await fs.writeFile(filePath, fileBuffer);

    return {
      fileName,
      originalName,
      fileSize: fileBuffer.length,
      fileType: mimeType,
      filePath: filePath,
    };
  }

  async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'text/plain') {
        const buffer = await fs.readFile(filePath);
        return buffer.toString('utf-8');
      }
      
      if (mimeType === 'application/pdf') {
        try {
          const buffer = await fs.readFile(filePath);
          // Use createRequire for ES modules
          const { createRequire } = await import('module');
          const require = createRequire(import.meta.url);
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(buffer);
          console.log('PDF text extracted successfully, length:', pdfData.text.length);
          console.log('First 200 chars:', pdfData.text.substring(0, 200) + '...');
          return pdfData.text;
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          throw new Error('Failed to extract text from PDF');
        }
      }
      
      if (mimeType.includes('word')) {
        // For Word document extraction, you would use a library like mammoth
        return 'Word document text extraction would be implemented here with a library like mammoth';
      }
      
      return 'Text extraction not supported for this file type';
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  getFileUrl(fileName: string): string {
    return `/api/files/${fileName}`;
  }
}

export const fileService = new FileService();
