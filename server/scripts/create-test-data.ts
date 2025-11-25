/**
 * Test Data Script: Multi-Location Context Testing
 * 
 * Creates comprehensive test data using EXISTING organizational hierarchy to verify context filtering:
 * - Uses actual companies, business units, and locations from Client Master Hierarchy
 * - Test users with different org assignments and roles
 * - Contracts distributed across different locations
 * - Sales data and calculations linked to contracts
 * 
 * Usage:
 *   tsx server/scripts/create-test-data.ts
 */

import { db } from '../db';
import { 
  users, userOrganizationRoles,
  contracts, salesData, contractRoyaltyCalculations
} from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createTestData() {
  console.log('🧪 Creating Multi-Location Test Data...\n');

  try {
    // Get admin user ID for audit columns
    const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    const ADMIN_USER_ID = adminUser?.id;

    if (!ADMIN_USER_ID) {
      throw new Error('Admin user not found. Please ensure admin user exists before running this script.');
    }

    // ==========================================
    // STEP 1: Use Existing Organizational Hierarchy
    // ==========================================
    console.log('🏢 STEP 1: Using Existing Organizational Hierarchy...');
    
    // Using REAL data from your Client Master Hierarchy:
    // - Acme Corporation (cmp-001)
    //   - Sales Division (org-001)
    //     - New York Office (loc-001)
    //     - Los Angeles Office (loc-002)
    //   - Operations Division (org-002)
    // - Rao Group of Companies (eeca99c0-de3e-4d69-8599-8ff6f1dc9dcc)
    //   - Dallas Unit (7e06ef6e-0dfb-4068-8e93-17c770b7d053)
    //     - Frisco (391f5e20-4161-4480-abca-a5b2a8f959f8)
    
    const ACME_COMPANY_ID = 'cmp-001';
    const SALES_DIVISION_ID = 'org-001';
    const OPERATIONS_DIVISION_ID = 'org-002';
    const NY_OFFICE_ID = 'loc-001';
    const LA_OFFICE_ID = 'loc-002';
    
    const RAO_GROUP_ID = 'eeca99c0-de3e-4d69-8599-8ff6f1dc9dcc';
    const DALLAS_UNIT_ID = '7e06ef6e-0dfb-4068-8e93-17c770b7d053';
    const FRISCO_LOCATION_ID = '391f5e20-4161-4480-abca-a5b2a8f959f8';

    console.log(`   ✓ Using Acme Corporation with 2 BUs and 2 Locations`);
    console.log(`   ✓ Using Rao Group of Companies with 1 BU and 1 Location\n`);

    // ==========================================
    // STEP 2: Create Test Users
    // ==========================================
    console.log('👥 STEP 2: Creating Test Users...');

    const hashedPassword = await bcrypt.hash('Test@123!', 10);

    // User 1: Alice (NY Office only - Location level)
    const [alice] = await db.insert(users).values({
      username: 'alice.test',
      email: 'alice@acmecorp.test',
      password: hashedPassword,
      role: 'user',
      firstName: 'Alice',
      lastName: 'Johnson',
    }).returning();

    await db.insert(userOrganizationRoles).values({
      userId: alice.id,
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: NY_OFFICE_ID,
      role: 'editor',
      createdBy: ADMIN_USER_ID,
      lastUpdatedBy: ADMIN_USER_ID,
    });

    console.log(`   ✓ Created Alice (NY Office only - editor)`);

    // User 2: Bob (LA Office only - Location level)
    const [bob] = await db.insert(users).values({
      username: 'bob.test',
      email: 'bob@acmecorp.test',
      password: hashedPassword,
      role: 'user',
      firstName: 'Bob',
      lastName: 'Smith',
    }).returning();

    await db.insert(userOrganizationRoles).values({
      userId: bob.id,
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: LA_OFFICE_ID,
      role: 'editor',
      createdBy: ADMIN_USER_ID,
      lastUpdatedBy: ADMIN_USER_ID,
    });

    console.log(`   ✓ Created Bob (LA Office only - editor)`);

    // User 3: Charlie (Sales Division level - sees both NY and LA)
    const [charlie] = await db.insert(users).values({
      username: 'charlie.test',
      email: 'charlie@acmecorp.test',
      password: hashedPassword,
      role: 'user',
      firstName: 'Charlie',
      lastName: 'Brown',
    }).returning();

    await db.insert(userOrganizationRoles).values({
      userId: charlie.id,
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: null, // Business Unit level access
      role: 'manager',
      createdBy: ADMIN_USER_ID,
      lastUpdatedBy: ADMIN_USER_ID,
    });

    console.log(`   ✓ Created Charlie (Sales Division level - manager)`);

    // User 4: Diana (Acme Corporation level - sees everything in Acme)
    const [diana] = await db.insert(users).values({
      username: 'diana.test',
      email: 'diana@acmecorp.test',
      password: hashedPassword,
      role: 'user',
      firstName: 'Diana',
      lastName: 'Prince',
    }).returning();

    await db.insert(userOrganizationRoles).values({
      userId: diana.id,
      companyId: ACME_COMPANY_ID,
      businessUnitId: null, // Company level access
      locationId: null,
      role: 'owner',
      createdBy: ADMIN_USER_ID,
      lastUpdatedBy: ADMIN_USER_ID,
    });

    console.log(`   ✓ Created Diana (Acme Corporation level - owner)\n`);

    // ==========================================
    // STEP 3: Create Contracts
    // ==========================================
    console.log('📄 STEP 3: Creating Contracts...');

    // Contract 1: NY Office (Alice's contract)
    const [contractNY] = await db.insert(contracts).values({
      originalName: 'NY-Sales-License-Agreement.pdf',
      fileName: 'ny-sales-license.pdf',
      filePath: '/test-data/contracts/ny-sales-license.pdf',
      fileSize: 150000,
      fileType: 'application/pdf',
      uploadedBy: alice.id,
      status: 'active',
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: NY_OFFICE_ID,
      displayName: 'NY Office Software License',
      contractType: 'license',
    }).returning();

    console.log(`   ✓ Created NY Office Contract (Alice)`);

    // Contract 2: LA Office (Bob's contract)
    const [contractLA] = await db.insert(contracts).values({
      originalName: 'LA-Distribution-Agreement.pdf',
      fileName: 'la-distribution.pdf',
      filePath: '/test-data/contracts/la-distribution.pdf',
      fileSize: 180000,
      fileType: 'application/pdf',
      uploadedBy: bob.id,
      status: 'active',
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: LA_OFFICE_ID,
      displayName: 'LA Office Distribution Agreement',
      contractType: 'license',
    }).returning();

    console.log(`   ✓ Created LA Office Contract (Bob)`);

    // Contract 3: Frisco Location (Rao Group)
    const [contractFrisco] = await db.insert(contracts).values({
      originalName: 'Frisco-Partnership-Agreement.pdf',
      fileName: 'frisco-partnership.pdf',
      filePath: '/test-data/contracts/frisco-partnership.pdf',
      fileSize: 200000,
      fileType: 'application/pdf',
      uploadedBy: diana.id,
      status: 'active',
      companyId: RAO_GROUP_ID,
      businessUnitId: DALLAS_UNIT_ID,
      locationId: FRISCO_LOCATION_ID,
      displayName: 'Frisco Partnership Agreement',
      contractType: 'partnership',
    }).returning();

    console.log(`   ✓ Created Frisco Contract (Rao Group)\n`);

    // ==========================================
    // STEP 4: Create Sales Data
    // ==========================================
    console.log('💰 STEP 4: Creating Sales Data...');

    // Sales for NY Contract
    await db.insert(salesData).values([
      {
        matchedContractId: contractNY.id,
        matchConfidence: '95.5',
        transactionDate: new Date('2024-01-15'),
        transactionId: 'NY-TXN-001',
        productName: 'Enterprise Software Suite',
        category: 'Software',
        territory: 'East Coast',
        grossAmount: '50000.00',
        netAmount: '45000.00',
        companyId: ACME_COMPANY_ID,
        businessUnitId: SALES_DIVISION_ID,
        locationId: NY_OFFICE_ID,
      },
      {
        matchedContractId: contractNY.id,
        matchConfidence: '92.0',
        transactionDate: new Date('2024-02-20'),
        transactionId: 'NY-TXN-002',
        productName: 'Professional Services',
        category: 'Services',
        territory: 'East Coast',
        grossAmount: '30000.00',
        netAmount: '28000.00',
        companyId: ACME_COMPANY_ID,
        businessUnitId: SALES_DIVISION_ID,
        locationId: NY_OFFICE_ID,
      },
    ]);

    console.log(`   ✓ Created 2 sales records for NY Contract`);

    // Sales for LA Contract
    await db.insert(salesData).values({
      matchedContractId: contractLA.id,
      matchConfidence: '88.0',
      transactionDate: new Date('2024-03-10'),
      transactionId: 'LA-TXN-001',
      productName: 'Cloud Platform Subscription',
      category: 'Software',
      territory: 'West Coast',
      grossAmount: '75000.00',
      netAmount: '72000.00',
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: LA_OFFICE_ID,
    });

    console.log(`   ✓ Created 1 sales record for LA Contract\n`);

    // ==========================================
    // STEP 5: Create License Fee Calculations
    // ==========================================
    console.log('📊 STEP 5: Creating License Fee Calculations...');

    await db.insert(contractRoyaltyCalculations).values({
      contractId: contractNY.id,
      name: 'Q1 2024 License Fees - NY Office',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      totalSalesAmount: '80000.00',
      totalRoyalty: '8000.00',
      salesCount: 2,
      calculatedBy: alice.id,
      status: 'approved',
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: NY_OFFICE_ID,
    });

    console.log(`   ✓ Created calculation for NY Contract`);

    await db.insert(contractRoyaltyCalculations).values({
      contractId: contractLA.id,
      name: 'Q1 2024 License Fees - LA Office',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      totalSalesAmount: '75000.00',
      totalRoyalty: '7500.00',
      salesCount: 1,
      calculatedBy: bob.id,
      status: 'pending_approval',
      companyId: ACME_COMPANY_ID,
      businessUnitId: SALES_DIVISION_ID,
      locationId: LA_OFFICE_ID,
    });

    console.log(`   ✓ Created calculation for LA Contract\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('═══════════════════════════════════════');
    console.log('📝 TEST DATA SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log('Organizations:  Using EXISTING hierarchy');
    console.log('  - Acme Corporation (2 BUs, 2 Locations)');
    console.log('  - Rao Group of Companies (1 BU, 1 Location)');
    console.log('Users:          4 created');
    console.log('  - alice.test (NY Office - editor)');
    console.log('  - bob.test (LA Office - editor)');
    console.log('  - charlie.test (Sales Division - manager)');
    console.log('  - diana.test (Acme Corporation - owner)');
    console.log('Contracts:      3 created');
    console.log('Sales Data:     3 records created');
    console.log('Calculations:   2 created');
    console.log('═══════════════════════════════════════\n');
    console.log('✅ Test data created successfully!');
    console.log('\n📋 TESTING SCENARIOS:');
    console.log('═══════════════════════════════════════');
    console.log('Login Credentials: (all passwords: Test@123!)');
    console.log('\n1. alice.test / Test@123!');
    console.log('   Context: Acme → Sales → NY Office [editor]');
    console.log('   Should see: 1 contract, 2 sales, 1 calculation');
    console.log('\n2. bob.test / Test@123!');
    console.log('   Context: Acme → Sales → LA Office [editor]');
    console.log('   Should see: 1 contract, 1 sale, 1 calculation');
    console.log('\n3. charlie.test / Test@123!');
    console.log('   Context: Acme → Sales Division [manager]');
    console.log('   Should see: 2 contracts, 3 sales, 2 calculations');
    console.log('\n4. diana.test / Test@123!');
    console.log('   Context: Acme Corporation [owner]');
    console.log('   Should see: 2 contracts (only Acme), 3 sales, 2 calculations');
    console.log('\n5. admin / Admin@123!');
    console.log('   Should see: EVERYTHING (bypasses filtering)');
    console.log('   Total: All contracts, sales, and calculations\n');

  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    process.exit(1);
  }
}

// Run test data creation
createTestData()
  .then(() => {
    console.log('🎉 All done! Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
