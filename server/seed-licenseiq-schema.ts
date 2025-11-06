import { db } from './db';
import { licenseiqEntities, licenseiqFields, type InsertLicenseiqEntity, type InsertLicenseiqField } from '@shared/schema';

/**
 * Seed LicenseIQ Schema Catalog with standard entities and fields
 * Matches TESTING_GUIDE.md specifications for field mapping examples
 */
export async function seedLicenseIQSchema() {
  console.log('🌱 Seeding LicenseIQ Schema Catalog...');

  try {
    // Check if already seeded
    const existingEntities = await db.select().from(licenseiqEntities);
    if (existingEntities.length > 0) {
      console.log('✓ LicenseIQ schema already seeded, skipping...');
      return;
    }

    // 1. Products Entity (Master Data) - Matches TESTING_GUIDE.md
    const productsEntityData: InsertLicenseiqEntity = {
      name: 'Products',
      technicalName: 'products',
      category: 'Master Data',
      description: 'Product catalog data for sales and royalty calculations',
    };
    const productsEntity = await db
      .insert(licenseiqEntities)
      .values(productsEntityData)
      .returning();

    const productsFields = [
      { fieldName: 'productCode', dataType: 'string', description: 'Unique product identifier', isRequired: true },
      { fieldName: 'productName', dataType: 'string', description: 'Product name or description', isRequired: true },
      { fieldName: 'category', dataType: 'string', description: 'Product category classification', isRequired: false },
      { fieldName: 'territory', dataType: 'string', description: 'Sales territory or region', isRequired: false },
      { fieldName: 'quantity', dataType: 'number', description: 'Quantity sold or ordered', isRequired: true },
      { fieldName: 'grossAmount', dataType: 'number', description: 'Total sales amount before deductions', isRequired: true },
      { fieldName: 'transactionDate', dataType: 'date', description: 'Date of transaction or sale', isRequired: true },
      { fieldName: 'transactionId', dataType: 'string', description: 'Unique transaction identifier', isRequired: true },
      { fieldName: 'unitPrice', dataType: 'number', description: 'Price per unit', isRequired: false },
      { fieldName: 'discount', dataType: 'number', description: 'Discount amount or percentage', isRequired: false },
    ];

    for (const field of productsFields) {
      await db.insert(licenseiqFields).values({
        entityId: productsEntity[0].id,
        ...field,
      });
    }

    // 2. Sales Data Entity (Transactional)
    const salesDataEntityData: InsertLicenseiqEntity = {
      name: 'Sales Data',
      technicalName: 'sales_data',
      category: 'Transactional',
      description: 'Sales transaction records for royalty calculations',
    };
    const salesDataEntity = await db
      .insert(licenseiqEntities)
      .values(salesDataEntityData)
      .returning();

    const salesDataFields = [
      { fieldName: 'salesId', dataType: 'string', description: 'Unique sales record identifier', isRequired: true },
      { fieldName: 'contractId', dataType: 'string', description: 'Associated contract reference', isRequired: true },
      { fieldName: 'productCode', dataType: 'string', description: 'Product identifier', isRequired: true },
      { fieldName: 'productName', dataType: 'string', description: 'Product name', isRequired: true },
      { fieldName: 'category', dataType: 'string', description: 'Product category', isRequired: false },
      { fieldName: 'territory', dataType: 'string', description: 'Sales territory', isRequired: false },
      { fieldName: 'quantity', dataType: 'number', description: 'Quantity sold', isRequired: true },
      { fieldName: 'grossAmount', dataType: 'number', description: 'Gross sales amount', isRequired: true },
      { fieldName: 'netAmount', dataType: 'number', description: 'Net sales amount after deductions', isRequired: false },
      { fieldName: 'transactionDate', dataType: 'date', description: 'Transaction date', isRequired: true },
      { fieldName: 'customerId', dataType: 'string', description: 'Customer identifier', isRequired: false },
      { fieldName: 'invoiceNumber', dataType: 'string', description: 'Invoice reference number', isRequired: false },
    ];

    for (const field of salesDataFields) {
      await db.insert(licenseiqFields).values({
        entityId: salesDataEntity[0].id,
        ...field,
      });
    }

    // 3. Contract Terms Entity (Master Data)
    const contractTermsEntityData: InsertLicenseiqEntity = {
      name: 'Contract Terms',
      technicalName: 'contract_terms',
      category: 'Master Data',
      description: 'Contract metadata and key terms',
    };
    const contractTermsEntity = await db
      .insert(licenseiqEntities)
      .values(contractTermsEntityData)
      .returning();

    const contractTermsFields = [
      { fieldName: 'contractId', dataType: 'string', description: 'Unique contract identifier', isRequired: true },
      { fieldName: 'contractNumber', dataType: 'string', description: 'Contract reference number', isRequired: false },
      { fieldName: 'yourOrganization', dataType: 'string', description: 'Your organization name', isRequired: true },
      { fieldName: 'counterparty', dataType: 'string', description: 'Other party name', isRequired: true },
      { fieldName: 'contractType', dataType: 'string', description: 'Type of contract', isRequired: false },
      { fieldName: 'effectiveDate', dataType: 'date', description: 'Contract start date', isRequired: true },
      { fieldName: 'expirationDate', dataType: 'date', description: 'Contract end date', isRequired: false },
      { fieldName: 'status', dataType: 'string', description: 'Contract status', isRequired: false },
      { fieldName: 'territory', dataType: 'string', description: 'Contract territory or region', isRequired: false },
      { fieldName: 'currency', dataType: 'string', description: 'Contract currency', isRequired: false },
    ];

    for (const field of contractTermsFields) {
      await db.insert(licenseiqFields).values({
        entityId: contractTermsEntity[0].id,
        ...field,
      });
    }

    // 4. Royalty Rules Entity (Rules)
    const royaltyRulesEntityData: InsertLicenseiqEntity = {
      name: 'Royalty Rules',
      technicalName: 'royalty_rules',
      category: 'Rules',
      description: 'Royalty calculation rules and payment terms',
    };
    const royaltyRulesEntity = await db
      .insert(licenseiqEntities)
      .values(royaltyRulesEntityData)
      .returning();

    const royaltyRulesFields = [
      { fieldName: 'ruleId', dataType: 'string', description: 'Unique rule identifier', isRequired: true },
      { fieldName: 'contractId', dataType: 'string', description: 'Associated contract', isRequired: true },
      { fieldName: 'ruleName', dataType: 'string', description: 'Rule name or title', isRequired: true },
      { fieldName: 'ruleType', dataType: 'string', description: 'Type of royalty rule', isRequired: true },
      { fieldName: 'productCategories', dataType: 'string[]', description: 'Applicable product categories', isRequired: false },
      { fieldName: 'territories', dataType: 'string[]', description: 'Applicable territories', isRequired: false },
      { fieldName: 'baseRate', dataType: 'number', description: 'Base royalty rate percentage', isRequired: false },
      { fieldName: 'minimumRoyalty', dataType: 'number', description: 'Minimum royalty amount', isRequired: false },
      { fieldName: 'effectiveDate', dataType: 'date', description: 'Rule effective date', isRequired: false },
      { fieldName: 'expirationDate', dataType: 'date', description: 'Rule expiration date', isRequired: false },
    ];

    for (const field of royaltyRulesFields) {
      await db.insert(licenseiqFields).values({
        entityId: royaltyRulesEntity[0].id,
        ...field,
      });
    }

    // 5. Payments Entity (Transactional)
    const paymentsEntityData: InsertLicenseiqEntity = {
      name: 'Payments',
      technicalName: 'payments',
      category: 'Transactional',
      description: 'Payment records and calculation results',
    };
    const paymentsEntity = await db
      .insert(licenseiqEntities)
      .values(paymentsEntityData)
      .returning();

    const paymentsFields = [
      { fieldName: 'paymentId', dataType: 'string', description: 'Unique payment identifier', isRequired: true },
      { fieldName: 'contractId', dataType: 'string', description: 'Associated contract', isRequired: true },
      { fieldName: 'calculationId', dataType: 'string', description: 'Calculation run reference', isRequired: false },
      { fieldName: 'paymentDate', dataType: 'date', description: 'Payment date', isRequired: true },
      { fieldName: 'periodStart', dataType: 'date', description: 'Calculation period start', isRequired: false },
      { fieldName: 'periodEnd', dataType: 'date', description: 'Calculation period end', isRequired: false },
      { fieldName: 'totalAmount', dataType: 'number', description: 'Total payment amount', isRequired: true },
      { fieldName: 'currency', dataType: 'string', description: 'Payment currency', isRequired: false },
      { fieldName: 'status', dataType: 'string', description: 'Payment status', isRequired: false },
      { fieldName: 'notes', dataType: 'string', description: 'Payment notes or memo', isRequired: false },
    ];

    for (const field of paymentsFields) {
      await db.insert(licenseiqFields).values({
        entityId: paymentsEntity[0].id,
        ...field,
      });
    }

    console.log('✅ LicenseIQ Schema seeded successfully:');
    console.log('  • Products (10 fields)');
    console.log('  • Sales Data (12 fields)');
    console.log('  • Contract Terms (10 fields)');
    console.log('  • Royalty Rules (10 fields)');
    console.log('  • Payments (10 fields)');
    console.log('  📊 Total: 5 entities, 52 fields');
  } catch (error) {
    console.error('❌ Error seeding LicenseIQ schema:', error);
    throw error;
  }
}
