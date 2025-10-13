/**
 * PDF Invoice Generation Service
 * Generates royalty invoices and payment reports in PDF format
 * Uses html-pdf-node for HTML to PDF conversion
 */

// @ts-ignore - html-pdf-node doesn't have types
import pdf from 'html-pdf-node';

export interface InvoiceData {
  calculationId: string;
  calculationName: string;
  contractName: string;
  vendorName: string;
  licensee: string;
  calculationDate: Date;
  periodStart?: Date;
  periodEnd?: Date;
  totalRoyalty: number;
  minimumGuarantee?: number;
  finalRoyalty: number;
  breakdown: Array<{
    productName: string;
    category: string;
    quantity: number;
    grossAmount: number;
    ruleApplied: string;
    calculatedRoyalty: number;
    explanation: string;
  }>;
  currency: string;
  paymentTerms?: string;
}

export class PDFInvoiceService {
  /**
   * Generate detailed invoice PDF with full breakdown
   */
  static async generateDetailedInvoice(data: InvoiceData): Promise<Buffer> {
    const html = this.buildDetailedInvoiceHTML(data);
    return this.generatePDF(html);
  }

  /**
   * Generate summary invoice PDF with totals only
   */
  static async generateSummaryInvoice(data: InvoiceData): Promise<Buffer> {
    const html = this.buildSummaryInvoiceHTML(data);
    return this.generatePDF(html);
  }

  /**
   * Convert HTML to PDF buffer
   */
  private static async generatePDF(html: string): Promise<Buffer> {
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
    };

    const file = { content: html };
    const pdfBuffer = await pdf.generatePdf(file, options);
    return pdfBuffer as Buffer;
  }

  /**
   * Build detailed invoice HTML with line items
   */
  private static buildDetailedInvoiceHTML(data: InvoiceData): string {
    const periodText = data.periodStart && data.periodEnd
      ? `${this.formatDate(data.periodStart)} - ${this.formatDate(data.periodEnd)}`
      : 'All Time';

    const lineItems = data.breakdown.map((item, index) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500;">${this.escapeHtml(item.productName)}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${this.escapeHtml(item.category || 'N/A')}</div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity.toLocaleString()}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 12px;">${this.escapeHtml(item.ruleApplied)}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${this.escapeHtml(item.explanation)}</div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${item.calculatedRoyalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Royalty Invoice - ${data.calculationName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header p { font-size: 14px; opacity: 0.95; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-section h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 8px; }
    .info-section p { font-size: 14px; margin-bottom: 4px; }
    .info-section .highlight { font-size: 16px; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f9fafb; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .totals-section { background: #f9fafb; padding: 20px; margin-top: 30px; border-radius: 8px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.final { border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #7c3aed; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ROYALTY INVOICE</h1>
    <p>Detailed Payment Report</p>
  </div>

  <div class="invoice-info" style="display: flex; justify-content: space-between;">
    <div class="info-section" style="flex: 1;">
      <h3>Calculation Details</h3>
      <p class="highlight">${this.escapeHtml(data.calculationName)}</p>
      <p>Calculation ID: ${this.escapeHtml(data.calculationId)}</p>
      <p>Date: ${this.formatDate(data.calculationDate)}</p>
      <p>Period: ${periodText}</p>
    </div>
    <div class="info-section" style="flex: 1; text-align: right;">
      <h3>Contract Information</h3>
      <p class="highlight">${this.escapeHtml(data.contractName)}</p>
      <p>Licensor: ${this.escapeHtml(data.vendorName)}</p>
      <p>Licensee: ${this.escapeHtml(data.licensee)}</p>
      ${data.paymentTerms ? `<p>Terms: ${this.escapeHtml(data.paymentTerms)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th style="width: 250px;">Product</th>
        <th style="width: 80px; text-align: center;">Qty</th>
        <th style="width: 100px; text-align: right;">Gross Sales</th>
        <th>Royalty Rule</th>
        <th style="width: 120px; text-align: right;">Royalty Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="total-row">
      <span>Subtotal Royalty:</span>
      <span style="font-weight: 600;">$${data.totalRoyalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
    ${data.minimumGuarantee ? `
    <div class="total-row">
      <span>Minimum Guarantee:</span>
      <span style="font-weight: 600;">$${data.minimumGuarantee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
    ` : ''}
    <div class="total-row final">
      <span>TOTAL AMOUNT DUE:</span>
      <span>$${data.finalRoyalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${data.currency}</span>
    </div>
  </div>

  <div class="footer">
    <p>Generated by LicenseIQ Research Platform | Cimpleit Inc</p>
    <p>This is a system-generated invoice. For questions, please contact your account manager.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Build summary invoice HTML with totals only
   */
  private static buildSummaryInvoiceHTML(data: InvoiceData): string {
    const periodText = data.periodStart && data.periodEnd
      ? `${this.formatDate(data.periodStart)} - ${this.formatDate(data.periodEnd)}`
      : 'All Time';

    // Calculate summary stats
    const totalItems = data.breakdown.length;
    const totalQuantity = data.breakdown.reduce((sum, item) => sum + item.quantity, 0);
    const totalSales = data.breakdown.reduce((sum, item) => sum + item.grossAmount, 0);
    const rulesApplied = Array.from(new Set(data.breakdown.map(item => item.ruleApplied)));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Royalty Summary - ${data.calculationName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
    .header p { font-size: 16px; opacity: 0.95; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
    .summary-card { background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .summary-card h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 12px; }
    .summary-card .value { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .summary-card .label { font-size: 14px; color: #6b7280; }
    .amount-due { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 32px; border-radius: 12px; text-align: center; margin: 40px 0; }
    .amount-due h2 { font-size: 16px; text-transform: uppercase; opacity: 0.9; margin-bottom: 8px; }
    .amount-due .amount { font-size: 48px; font-weight: 700; }
    .info-section { background: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #6b7280; font-size: 14px; }
    .info-row .value { font-weight: 500; font-size: 14px; }
    .rules-list { margin-top: 12px; }
    .rule-tag { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 4px 4px 4px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ROYALTY PAYMENT SUMMARY</h1>
    <p>${this.escapeHtml(data.calculationName)}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <h3>Total Items</h3>
      <div class="value">${totalItems.toLocaleString()}</div>
      <div class="label">Products sold</div>
    </div>
    <div class="summary-card">
      <h3>Total Units</h3>
      <div class="value">${totalQuantity.toLocaleString()}</div>
      <div class="label">Quantity sold</div>
    </div>
    <div class="summary-card">
      <h3>Gross Sales</h3>
      <div class="value">$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="label">Total revenue</div>
    </div>
    <div class="summary-card">
      <h3>Rules Applied</h3>
      <div class="value">${rulesApplied.length}</div>
      <div class="label">Royalty rules used</div>
    </div>
  </div>

  <div class="amount-due">
    <h2>Total Amount Due</h2>
    <div class="amount">$${data.finalRoyalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${data.currency}</div>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="label">Contract:</span>
      <span class="value">${this.escapeHtml(data.contractName)}</span>
    </div>
    <div class="info-row">
      <span class="label">Licensor:</span>
      <span class="value">${this.escapeHtml(data.vendorName)}</span>
    </div>
    <div class="info-row">
      <span class="label">Licensee:</span>
      <span class="value">${this.escapeHtml(data.licensee)}</span>
    </div>
    <div class="info-row">
      <span class="label">Calculation Period:</span>
      <span class="value">${periodText}</span>
    </div>
    <div class="info-row">
      <span class="label">Calculation Date:</span>
      <span class="value">${this.formatDate(data.calculationDate)}</span>
    </div>
    ${data.paymentTerms ? `
    <div class="info-row">
      <span class="label">Payment Terms:</span>
      <span class="value">${this.escapeHtml(data.paymentTerms)}</span>
    </div>
    ` : ''}
    ${data.minimumGuarantee ? `
    <div class="info-row">
      <span class="label">Minimum Guarantee:</span>
      <span class="value">$${data.minimumGuarantee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
    ` : ''}
  </div>

  <div class="info-section">
    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Royalty Rules Applied</h3>
    <div class="rules-list">
      ${rulesApplied.map(rule => `<span class="rule-tag">${this.escapeHtml(rule)}</span>`).join('')}
    </div>
  </div>

  <div class="footer">
    <p>Generated by LicenseIQ Research Platform | Cimpleit Inc</p>
    <p>This is a system-generated summary invoice. For detailed breakdown, please request the detailed invoice.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Escape HTML to prevent injection
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }
}
