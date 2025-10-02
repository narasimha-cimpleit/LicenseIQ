import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';

// Schema for validating sales data rows (vendorId added separately during upload)
const salesDataRowSchema = z.object({
  transactionDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  transactionId: z.string().optional(),
  productCode: z.string().optional(),
  productName: z.string().optional(),
  category: z.string().optional(),
  territory: z.string().optional(),
  currency: z.string().default('USD'),
  grossAmount: z.number().or(z.string().transform(val => parseFloat(val))).refine(val => !isNaN(Number(val)), 'Invalid gross amount'),
  netAmount: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
  quantity: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
  unitPrice: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
});

export interface ParsedSalesRow {
  rowIndex: number;
  rowData: any;
  validationStatus: 'valid' | 'invalid';
  validationErrors?: string[];
  externalId?: string;
}

export interface ParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ParsedSalesRow[];
  errors?: string[];
}

export class SalesDataParser {
  /**
   * Parse CSV file
   */
  static async parseCSV(fileBuffer: Buffer): Promise<ParseResult> {
    return new Promise((resolve) => {
      const fileContent = fileBuffer.toString('utf-8');
      
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const parseResult = this.validateAndTransformRows(results.data, results.errors);
          resolve(parseResult);
        },
        error: (error) => {
          resolve({
            success: false,
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            rows: [],
            errors: [error.message]
          });
        }
      });
    });
  }

  /**
   * Parse Excel file (XLSX/XLS)
   */
  static async parseExcel(fileBuffer: Buffer): Promise<ParseResult> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Use first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return {
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          rows: [],
          errors: ['No sheets found in Excel file']
        };
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      return this.validateAndTransformRows(jsonData, []);
    } catch (error) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        rows: [],
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Validate and transform raw rows into ParsedSalesRow format
   */
  private static validateAndTransformRows(rawRows: any[], parseErrors: any[]): ParseResult {
    const parsedRows: ParsedSalesRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    rawRows.forEach((row, index) => {
      const result = salesDataRowSchema.safeParse(row);
      
      if (result.success) {
        parsedRows.push({
          rowIndex: index,
          rowData: result.data,
          validationStatus: 'valid',
          externalId: row.transactionId || `row-${index}`
        });
        validCount++;
      } else {
        const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        parsedRows.push({
          rowIndex: index,
          rowData: row,
          validationStatus: 'invalid',
          validationErrors: errors,
          externalId: row.transactionId || `row-${index}`
        });
        invalidCount++;
      }
    });

    return {
      success: parseErrors.length === 0,
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      rows: parsedRows,
      errors: parseErrors.map(err => err.message)
    };
  }

  /**
   * Detect file type and parse accordingly
   */
  static async parseFile(fileBuffer: Buffer, fileName: string): Promise<ParseResult> {
    const ext = fileName.toLowerCase().split('.').pop();
    
    switch (ext) {
      case 'csv':
        return this.parseCSV(fileBuffer);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(fileBuffer);
      default:
        return {
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          rows: [],
          errors: [`Unsupported file type: ${ext}. Please upload CSV or Excel files.`]
        };
    }
  }
}
