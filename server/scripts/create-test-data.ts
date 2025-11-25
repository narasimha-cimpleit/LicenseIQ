/**
 * Test Data Script: Multi-Location Context Testing
 * 
 * Creates comprehensive test data to verify organizational context filtering:
 * - 3 Companies, each with 2 Business Units, each with 2 Locations
 * - Test users with different org assignments and roles
 * - Contracts distributed across different locations
 * - Sales data and calculations linked to contracts
 * 
 * Usage:
 *   tsx server/scripts/create-test-data.ts
 */

import { db } from '../db';
import { 
  companies, businessUnits, locations, users, userOrganizations,
  contracts, salesData, contractRoyaltyCalculations
} from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createTestData() {
  console.log('🧪 Creating Multi-Location Test Data...\n');

  try {
    // ==========================================
    // STEP 1: Create Organizational Hierarchy
    // ==========================================
    console.log('🏢 STEP 1: Creating Organizational Hierarchy...');
    
    // Company A: Tech Corp
    const [companyA] = await db.insert(companies).values({
      companyId: 'TEST-COMP-A',
      companyName: 'Tech Corp',
      companyDescr: 'Technology Company - Test Data',
      status: 'Active',
    }).returning();

    const [buA1] = await db.insert(businessUnits).values({
      businessUnitId: 'TEST-BU-A1',
      companyId: companyA.companyId,
      businessUnitName: 'Software Division',
      businessUnitDescr: 'Software products',
      status: 'Active',
    }).returning();

    const [buA2] = await db.insert(businessUnits).values({
      businessUnitId: 'TEST-BU-A2',
      companyId: companyA.companyId,
      businessUnitName: 'Hardware Division',
      businessUnitDescr: 'Hardware products',
      status: 'Active',
    }).returning();

    const [locA1_1] = await db.insert(locations).values({
      locationId: 'TEST-LOC-A1-1',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationName: 'San Francisco Office',
      locationDescr: 'SF HQ',
      status: 'Active',
    }).returning();

    const [locA1_2] = await db.insert(locations).values({
      locationId: 'TEST-LOC-A1-2',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationName: 'New York Office',
      locationDescr: 'NY Branch',
      status: 'Active',
    }).returning();

    const [locA2_1] = await db.insert(locations).values({
      locationId: 'TEST-LOC-A2-1',
      companyId: companyA.companyId,
      businessUnitId: buA2.businessUnitId,
      locationName: 'Austin Office',
      locationDescr: 'Austin HQ',
      status: 'Active',
    }).returning();

    console.log(`   ✓ Created Company A (Tech Corp) with 2 BUs and 3 Locations`);

    // Company B: Media Inc
    const [companyB] = await db.insert(companies).values({
      companyId: 'TEST-COMP-B',
      companyName: 'Media Inc',
      companyDescr: 'Media Company - Test Data',
      status: 'Active',
    }).returning();

    const [buB1] = await db.insert(businessUnits).values({
      businessUnitId: 'TEST-BU-B1',
      companyId: companyB.companyId,
      businessUnitName: 'Publishing',
      businessUnitDescr: 'Publishing division',
      status: 'Active',
    }).returning();

    const [locB1_1] = await db.insert(locations).values({
      locationId: 'TEST-LOC-B1-1',
      companyId: companyB.companyId,
      businessUnitId: buB1.businessUnitId,
      locationName: 'Los Angeles Office',
      locationDescr: 'LA HQ',
      status: 'Active',
    }).returning();

    console.log(`   ✓ Created Company B (Media Inc) with 1 BU and 1 Location\n`);

    // ==========================================
    // STEP 2: Create Test Users
    // ==========================================
    console.log('👥 STEP 2: Creating Test Users...');

    const hashedPassword = await bcrypt.hash('Test@123!', 10);

    // User 1: Alice (SF Location only)
    const [alice] = await db.insert(users).values({
      username: 'alice.test',
      email: 'alice@techcorp.test',
      password: hashedPassword,
      role: 'user',
      fullName: 'Alice Johnson',
    }).returning();

    await db.insert(userOrganizations).values({
      userId: alice.id,
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_1.locationId,
      contextRole: 'editor',
    });

    console.log(`   ✓ Created Alice (SF Location only)`);

    // User 2: Bob (NY Location only)
    const [bob] = await db.insert(users).values({
      username: 'bob.test',
      email: 'bob@techcorp.test',
      password: hashedPassword,
      role: 'user',
      fullName: 'Bob Smith',
    }).returning();

    await db.insert(userOrganizations).values({
      userId: bob.id,
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_2.locationId,
      contextRole: 'editor',
    });

    console.log(`   ✓ Created Bob (NY Location only)`);

    // User 3: Charlie (Software Division level - sees both SF and NY)
    const [charlie] = await db.insert(users).values({
      username: 'charlie.test',
      email: 'charlie@techcorp.test',
      password: hashedPassword,
      role: 'user',
      fullName: 'Charlie Brown',
    }).returning();

    await db.insert(userOrganizations).values({
      userId: charlie.id,
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: null, // Business Unit level access
      contextRole: 'manager',
    });

    console.log(`   ✓ Created Charlie (BU level - sees SF + NY)`);

    // User 4: Diana (Company level - sees everything)
    const [diana] = await db.insert(users).values({
      username: 'diana.test',
      email: 'diana@techcorp.test',
      password: hashedPassword,
      role: 'user',
      fullName: 'Diana Prince',
    }).returning();

    await db.insert(userOrganizations).values({
      userId: diana.id,
      companyId: companyA.companyId,
      businessUnitId: null, // Company level access
      locationId: null,
      contextRole: 'owner',
    });

    console.log(`   ✓ Created Diana (Company level - sees all)\n`);

    // ==========================================
    // STEP 3: Create Contracts
    // ==========================================
    console.log('📄 STEP 3: Creating Contracts...');

    // Contract 1: SF Location (Alice's contract)
    const [contractSF] = await db.insert(contracts).values({
      originalName: 'SF-Software-License.pdf',
      filePath: '/test/sf-license.pdf',
      uploadedBy: alice.id,
      status: 'active',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_1.locationId,
    }).returning();

    console.log(`   ✓ Created SF Contract (Alice)`);

    // Contract 2: NY Location (Bob's contract)
    const [contractNY] = await db.insert(contracts).values({
      originalName: 'NY-Software-License.pdf',
      filePath: '/test/ny-license.pdf',
      uploadedBy: bob.id,
      status: 'active',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_2.locationId,
    }).returning();

    console.log(`   ✓ Created NY Contract (Bob)`);

    // Contract 3: Austin Location (Hardware)
    const [contractAustin] = await db.insert(contracts).values({
      originalName: 'Austin-Hardware-License.pdf',
      filePath: '/test/austin-license.pdf',
      uploadedBy: diana.id, // Diana uploaded (company level)
      status: 'active',
      companyId: companyA.companyId,
      businessUnitId: buA2.businessUnitId,
      locationId: locA2_1.locationId,
    }).returning();

    console.log(`   ✓ Created Austin Contract (Hardware)\n`);

    // ==========================================
    // STEP 4: Create Sales Data
    // ==========================================
    console.log('💰 STEP 4: Creating Sales Data...');

    // Sales for SF Contract
    await db.insert(salesData).values([
      {
        matchedContractId: contractSF.id,
        matchConfidence: '95.5',
        transactionDate: new Date('2024-01-15'),
        transactionId: 'SF-TXN-001',
        productName: 'Enterprise Software',
        category: 'Software',
        territory: 'West Coast',
        grossAmount: '50000.00',
        netAmount: '45000.00',
        companyId: companyA.companyId,
        businessUnitId: buA1.businessUnitId,
        locationId: locA1_1.locationId,
      },
      {
        matchedContractId: contractSF.id,
        matchConfidence: '92.0',
        transactionDate: new Date('2024-02-20'),
        transactionId: 'SF-TXN-002',
        productName: 'Professional Services',
        category: 'Services',
        territory: 'West Coast',
        grossAmount: '30000.00',
        netAmount: '28000.00',
        companyId: companyA.companyId,
        businessUnitId: buA1.businessUnitId,
        locationId: locA1_1.locationId,
      },
    ]);

    console.log(`   ✓ Created 2 sales records for SF Contract`);

    // Sales for NY Contract
    await db.insert(salesData).values({
      matchedContractId: contractNY.id,
      matchConfidence: '88.0',
      transactionDate: new Date('2024-03-10'),
      transactionId: 'NY-TXN-001',
      productName: 'Cloud Subscription',
      category: 'Software',
      territory: 'East Coast',
      grossAmount: '75000.00',
      netAmount: '72000.00',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_2.locationId,
    });

    console.log(`   ✓ Created 1 sales record for NY Contract\n`);

    // ==========================================
    // STEP 5: Create Royalty Calculations
    // ==========================================
    console.log('📊 STEP 5: Creating Royalty Calculations...');

    await db.insert(contractRoyaltyCalculations).values({
      contractId: contractSF.id,
      name: 'Q1 2024 Royalties - SF',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      totalSalesAmount: '80000.00',
      totalRoyalty: '8000.00',
      salesCount: 2,
      calculatedBy: alice.id,
      status: 'approved',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_1.locationId,
    });

    console.log(`   ✓ Created calculation for SF Contract`);

    await db.insert(contractRoyaltyCalculations).values({
      contractId: contractNY.id,
      name: 'Q1 2024 Royalties - NY',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      totalSalesAmount: '75000.00',
      totalRoyalty: '7500.00',
      salesCount: 1,
      calculatedBy: bob.id,
      status: 'pending_approval',
      companyId: companyA.companyId,
      businessUnitId: buA1.businessUnitId,
      locationId: locA1_2.locationId,
    });

    console.log(`   ✓ Created calculation for NY Contract\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('═══════════════════════════════════════');
    console.log('📝 TEST DATA SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log('Companies:     2 created');
    console.log('Business Units: 3 created');
    console.log('Locations:     4 created');
    console.log('Users:         4 created (alice, bob, charlie, diana)');
    console.log('Contracts:     3 created (SF, NY, Austin)');
    console.log('Sales Data:    3 records created');
    console.log('Calculations:  2 created');
    console.log('═══════════════════════════════════════\n');
    console.log('✅ Test data created successfully!');
    console.log('\n📋 TEST SCENARIOS:');
    console.log('1. Alice (SF only) - should see: 1 contract, 2 sales, 1 calc');
    console.log('2. Bob (NY only) - should see: 1 contract, 1 sale, 1 calc');
    console.log('3. Charlie (BU level) - should see: 2 contracts, 3 sales, 2 calcs');
    console.log('4. Diana (Company level) - should see: 3 contracts, 3 sales, 2 calcs');
    console.log('5. Admin - should see EVERYTHING (bypass filtering)');

  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    process.exit(1);
  }
}

// Run test data creation
createTestData()
  .then(() => {
    console.log('\n🎉 All done! Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
