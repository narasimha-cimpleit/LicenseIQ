import { db } from './db';
import { licenseiqEntities, licenseiqFields, type InsertLicenseiqEntity, type InsertLicenseiqField } from '@shared/schema';

/**
 * Seed LicenseIQ Schema Catalog with standard entities and fields
 * Now incrementally adds missing entities instead of all-or-nothing
 */
export async function seedLicenseIQSchema() {
  console.log('🌱 Seeding LicenseIQ Schema Catalog...');

  try {
    // Check which entities already exist
    const existingEntities = await db.select().from(licenseiqEntities);
    const existingTechnicalNames = new Set(existingEntities.map(e => e.technicalName));
    
    // Define all 28 standard entities
    const standardEntities: InsertLicenseiqEntity[] = [
      // Organization Hierarchy (3)
      { name: 'Companies', technicalName: 'companies', category: 'Organization Hierarchy', description: 'Top-level company entities in the organizational hierarchy' },
      { name: 'Business Units', technicalName: 'business_units', category: 'Organization Hierarchy', description: 'Business units within companies' },
      { name: 'Locations', technicalName: 'locations', category: 'Organization Hierarchy', description: 'Physical or logical locations within business units' },
      // Original 5 entities
      { name: 'Products', technicalName: 'products', category: 'Master Data', description: 'Product catalog data for sales and royalty calculations' },
      { name: 'Sales Data', technicalName: 'sales_data', category: 'Transactional', description: 'Sales transaction records for royalty calculations' },
      { name: 'Contract Terms', technicalName: 'contract_terms', category: 'Master Data', description: 'Contract metadata and key terms' },
      { name: 'Royalty Rules', technicalName: 'royalty_rules', category: 'Rules', description: 'Royalty calculation rules and payment terms' },
      { name: 'Payments', technicalName: 'payments', category: 'Transactional', description: 'Payment records and calculation results' },
      // Master Data (additional 17)
      { name: 'Customers/Parties', technicalName: 'customers_parties', category: 'Master Data', description: 'Customer and party master data' },
      { name: 'Items', technicalName: 'items', category: 'Master Data', description: 'Item master data' },
      { name: 'Item Category', technicalName: 'item_category', category: 'Master Data', description: 'Item categories' },
      { name: 'Item Class', technicalName: 'item_class', category: 'Master Data', description: 'Item classifications' },
      { name: 'Item Catalog', technicalName: 'item_catalog', category: 'Master Data', description: 'Item catalog' },
      { name: 'Item Structures', technicalName: 'item_structures', category: 'Master Data', description: 'Item structures and hierarchies' },
      { name: 'Customer Sites', technicalName: 'customer_sites', category: 'Master Data', description: 'Customer site locations' },
      { name: 'Customer Site Uses', technicalName: 'customer_site_uses', category: 'Master Data', description: 'Customer site uses' },
      { name: 'Suppliers/Vendors', technicalName: 'suppliers_vendors', category: 'Master Data', description: 'Supplier and vendor master data' },
      { name: 'Supplier Sites', technicalName: 'supplier_sites', category: 'Master Data', description: 'Supplier site locations' },
      { name: 'Payment Terms', technicalName: 'payment_terms', category: 'Master Data', description: 'Payment terms master data' },
      { name: 'Organizations', technicalName: 'organizations', category: 'Master Data', description: 'Organization hierarchy' },
      { name: 'Business Units (Template)', technicalName: 'business_units_template', category: 'Master Data', description: 'Business unit template data' },
      { name: 'Chart of Accounts', technicalName: 'chart_of_accounts', category: 'Master Data', description: 'General ledger accounts' },
      { name: 'Sales Reps', technicalName: 'sales_reps', category: 'Master Data', description: 'Sales representatives' },
      { name: 'Employee Master', technicalName: 'employee_master', category: 'Master Data', description: 'Employee master data' },
      // Transactions (9)
      { name: 'Sales Orders', technicalName: 'sales_orders', category: 'Transactions', description: 'Sales order headers' },
      { name: 'Sales Order Lines', technicalName: 'sales_order_lines', category: 'Transactions', description: 'Sales order line items' },
      { name: 'AR Invoices', technicalName: 'ar_invoices', category: 'Transactions', description: 'Accounts receivable invoice headers' },
      { name: 'AR Invoice Lines', technicalName: 'ar_invoice_lines', category: 'Transactions', description: 'Accounts receivable invoice lines' },
      { name: 'AP Invoices', technicalName: 'ap_invoices', category: 'Transactions', description: 'Accounts payable invoice headers' },
      { name: 'AP Invoice Lines', technicalName: 'ap_invoice_lines', category: 'Transactions', description: 'Accounts payable invoice lines' },
      { name: 'AP Invoice Payments', technicalName: 'ap_invoice_payments', category: 'Transactions', description: 'Accounts payable payments' },
      { name: 'Purchase Orders', technicalName: 'purchase_orders', category: 'Transactions', description: 'Purchase order headers' },
      { name: 'Purchase Order Lines', technicalName: 'purchase_order_lines', category: 'Transactions', description: 'Purchase order line items' },
    ];

    // Only seed entities that don't exist yet
    let newEntitiesCount = 0;
    for (const entityData of standardEntities) {
      if (!existingTechnicalNames.has(entityData.technicalName)) {
        await db.insert(licenseiqEntities).values(entityData);
        newEntitiesCount++;
        console.log(`  ✓ Added: ${entityData.name}`);
      }
    }
    
    if (newEntitiesCount === 0) {
      console.log('✓ All 28 LicenseIQ schema entities already exist');
      return;
    }
    
    console.log(`✅ Added ${newEntitiesCount} new entities to LicenseIQ schema (${existingEntities.length} already existed)`);
  } catch (error) {
    console.error('❌ Error seeding LicenseIQ schema:', error);
    throw error;
  }
}

