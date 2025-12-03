# LicenseIQ Context Hierarchy & Navigation Permission Testing Guide

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Organizational Context Hierarchy](#2-organizational-context-hierarchy)
3. [Role System](#3-role-system)
4. [Navigation Permission System](#4-navigation-permission-system)
5. [Complete Navigation Items Reference](#5-complete-navigation-items-reference)
6. [Data Filtering by Context](#6-data-filtering-by-context)
7. [Testing Scenarios](#7-testing-scenarios)
8. [Test User Credentials](#8-test-user-credentials)

---

## 1. System Architecture Overview

LicenseIQ implements a **multi-tenant architecture** with:
- **3-Level Organizational Hierarchy**: Company → Business Unit → Location
- **7 User Roles**: viewer, editor, analyst, auditor, manager, admin, owner
- **2 Admin Types**: System Admin (super user) vs Company Admin (company-scoped)
- **Context-Based Data Filtering**: Users see only data relevant to their assigned location/BU/company

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Active Context** | The current organizational scope (company/BU/location) a user is operating in |
| **Context Role** | The role a user has within their active context |
| **System Admin** | Super user with `isSystemAdmin=true`, bypasses all filters |
| **Company Admin** | User with admin/owner role scoped to a specific company |

---

## 2. Organizational Context Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPANY                                  │
│                    (Top-Level Entity)                            │
│        Example: "Monrovia Nursery Company"                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────┐   ┌─────────────────────────┐     │
│   │     BUSINESS UNIT 1     │   │     BUSINESS UNIT 2     │     │
│   │   (Division/Department) │   │   (Division/Department) │     │
│   │ "Monrovia Branded Div"  │   │ "Wight/Berryhill Div"   │     │
│   ├─────────────────────────┤   ├─────────────────────────┤     │
│   │                         │   │                         │     │
│   │  ┌─────────┐ ┌───────┐  │   │  ┌─────────┐ ┌───────┐  │     │
│   │  │LOCATION │ │LOCATION│  │   │  │LOCATION │ │LOCATION│  │     │
│   │  │Dayton OR│ │Visalia │  │   │  │ NC      │ │ OH    │  │     │
│   │  │  (HQ)   │ │  CA    │  │   │  │         │ │       │  │     │
│   │  └─────────┘ └───────┘  │   │  └─────────┘ └───────┘  │     │
│   │             ┌───────┐   │   │                         │     │
│   │             │Cairo  │   │   │                         │     │
│   │             │  GA   │   │   │                         │     │
│   │             └───────┘   │   │                         │     │
│   └─────────────────────────┘   └─────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Access Level Inheritance

| User Assigned To | Can See Data From |
|------------------|-------------------|
| **Location** | Only that specific location |
| **Business Unit** | All locations within that BU |
| **Company** | All BUs and all locations in the company |
| **System Admin** | Everything across all companies |

---

## 3. Role System

### 3.1 Seven User Roles (Lowest to Highest)

| Role | Level | Primary Purpose |
|------|-------|-----------------|
| **viewer** | 1 | Read-only access to basic data |
| **editor** | 2 | Can create/edit contracts and data |
| **analyst** | 3 | Financial analysis and calculations |
| **auditor** | 4 | Compliance review and audit trails |
| **manager** | 5 | Team oversight and approvals |
| **admin** | 6 | Full administrative control within company |
| **owner** | 7 | Complete control including system settings |

### 3.2 Two-Tier Admin System

| Admin Type | Flag | Access Scope |
|------------|------|--------------|
| **System Admin** | `isSystemAdmin = true` | ALL companies, ALL data, ALL features |
| **Company Admin** | `role = admin/owner` | Only their company's data and users |

### 3.3 System Admin vs Company Admin Comparison

| Action | System Admin | Company Admin |
|--------|--------------|---------------|
| View all companies | YES | NO (only their company) |
| Create new company | YES | NO |
| Delete company | YES | NO |
| Create users in any company | YES | NO (only their company) |
| View all navigation items | YES | Based on role permissions |
| Bypass context filtering | YES | NO |
| Access Configuration page | YES | YES (if role permits) |

---

## 4. Navigation Permission System

### 4.1 Three-Tier Permission Priority

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION CHECK ORDER                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   PRIORITY 1: User Override                                  │
│   ─────────────────────────                                  │
│   • Individual user-specific setting                         │
│   • If exists → USE THIS (ignore everything else)            │
│   • Set via: User Management page                            │
│                                                              │
│              ↓ (if not set)                                  │
│                                                              │
│   PRIORITY 2: Enabled Toggle (Role Permission)               │
│   ─────────────────────────────────────────────              │
│   • Role-based setting from Configuration page               │
│   • If toggle was explicitly set → USE THIS                  │
│   • ON = Show menu | OFF = Hide menu                         │
│                                                              │
│              ↓ (if never toggled)                            │
│                                                              │
│   PRIORITY 3: Default Access (defaultRoles)                  │
│   ─────────────────────────────────────────                  │
│   • Baseline permissions from seed data                      │
│   • Used when no explicit permission exists                  │
│   • Managed via: Configuration page "Default Access" column  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Permission Decision Flow

```
User requests navigation menu
           │
           ▼
┌──────────────────────┐
│ Is System Admin?     │──YES──▶ Show ALL menu items
└──────────────────────┘
           │NO
           ▼
┌──────────────────────┐
│ User Override exists?│──YES──▶ Use override value (true/false)
└──────────────────────┘
           │NO
           ▼
┌──────────────────────┐
│ Enabled Toggle set?  │──YES──▶ Use toggle value (true/false)
└──────────────────────┘
           │NO
           ▼
┌──────────────────────┐
│ Role in defaultRoles?│──YES──▶ Show menu item
└──────────────────────┘
           │NO
           ▼
      Hide menu item
```

### 4.3 Configuration Page Columns Explained

| Column | Purpose | When Applied |
|--------|---------|--------------|
| **Default Access** | Baseline for new users; what roles CAN access by default | Only when Enabled toggle not set |
| **Enabled** | Runtime override; immediately controls current access | Takes priority over Default Access |

---

## 5. Complete Navigation Items Reference

### 5.1 Navigation Categories (6 Total)

| Category | Icon | Collapsible | Default Expanded |
|----------|------|-------------|------------------|
| Main | Home | No | Yes |
| Contracts | FileText | Yes | Yes |
| Finance | DollarSign | Yes | Yes |
| Data Management | Database | Yes | No |
| AI & Analytics | Sparkles | Yes | No |
| Administration | Settings | Yes | No |

### 5.2 All 22 Navigation Items

#### MAIN Category

| # | Item Key | Menu Name | Route | Default Roles | Purpose |
|---|----------|-----------|-------|---------------|---------|
| 1 | `dashboard` | Dashboard | `/` | ALL 7 roles | Main overview with stats and charts |

#### CONTRACTS Category

| # | Item Key | Menu Name | Route | Default Roles | Purpose |
|---|----------|-----------|-------|---------------|---------|
| 2 | `contracts` | Contracts | `/contracts` | ALL 7 roles | View/manage all contracts |
| 3 | `contract-upload` | Upload Contract | `/upload` | editor, manager, admin, owner | Upload new PDF contracts |
| 4 | `royalty-rules` | License Fee Rules | `/contracts` | ALL 7 roles | View contract payment rules |
| 5 | `review-queue` | Review Queue | `/review-queue` | admin, owner | Review pending contract approvals |

#### FINANCE Category

| # | Item Key | Menu Name | Route | Default Roles | Purpose |
|---|----------|-----------|-------|---------------|---------|
| 6 | `royalty-calculator` | Royalty Calculator | `/calculations` | analyst, manager, admin, owner | Calculate license fees |
| 7 | `calculations` | Calculations | `/calculations` | analyst, auditor, manager, admin, owner | View calculation history |
| 8 | `sales-data` | Sales Data | `/sales-upload` | analyst, manager, admin, owner | Upload and view sales data |

#### DATA MANAGEMENT Category

| # | Item Key | Menu Name | Route | Default Roles | Purpose |
|---|----------|-----------|-------|---------------|---------|
| 9 | `erp-mapping` | ERP Mapping | `/master-data-mapping` | admin, owner | Map ERP fields to LicenseIQ |
| 10 | `erp-catalog` | ERP Catalog | `/erp-catalog` | admin, owner | Manage ERP system definitions |
| 11 | `licenseiq-catalog` | LicenseIQ Schema | `/licenseiq-schema` | admin, owner | View/edit standard schema |
| 12 | `master-data` | Master Data | `/master-data` | admin, owner | Manage companies/BUs/locations |

#### AI & ANALYTICS Category

| # | Item Key | Menu Name | Route | Default Roles | Purpose |
|---|----------|-----------|-------|---------------|---------|
| 13 | `liq-ai` | liQ AI | `/contract-qna` | ALL 7 roles | AI-powered contract Q&A |
| 14 | `knowledge-base` | Knowledge Base | `/knowledge-base` | admin, owner | Manage AI knowledge entries |
| 15 | `rag-dashboard` | RAG Dashboard | `/rag-dashboard` | admin, owner | Monitor RAG system health |
| 16 | `analytics` | Analytics | `/analytics` | analyst, admin, owner | View business analytics |
| 17 | `reports` | Reports | `/reports` | analyst, admin, owner | Generate and view reports |

#### ADMINISTRATION Category

| # | Item Key | Menu Name | Route | Default Roles | Purpose |
|---|----------|-----------|-------|---------------|---------|
| 18 | `user-management` | User Management | `/users` | admin, owner | Manage users and roles |
| 19 | `lead-management` | Lead Management | `/admin/leads` | admin, owner | Manage sales leads |
| 20 | `audit-trail` | Audit Trail | `/audit` | auditor, admin, owner | View system audit logs |
| 21 | `configuration` | Configuration | `/configuration` | admin, owner | System configuration & nav permissions |
| 22 | `navigation-manager` | Navigation Manager | `/navigation-manager` | owner ONLY | Advanced navigation customization |

### 5.3 Role-to-Navigation Matrix

| Menu Item | viewer | editor | analyst | auditor | manager | admin | owner |
|-----------|--------|--------|---------|---------|---------|-------|-------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Contracts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload Contract | - | ✓ | - | - | ✓ | ✓ | ✓ |
| License Fee Rules | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Review Queue | - | - | - | - | - | ✓ | ✓ |
| Royalty Calculator | - | - | ✓ | - | ✓ | ✓ | ✓ |
| Calculations | - | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sales Data | - | - | ✓ | - | ✓ | ✓ | ✓ |
| ERP Mapping | - | - | - | - | - | ✓ | ✓ |
| ERP Catalog | - | - | - | - | - | ✓ | ✓ |
| LicenseIQ Schema | - | - | - | - | - | ✓ | ✓ |
| Master Data | - | - | - | - | - | ✓ | ✓ |
| liQ AI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Knowledge Base | - | - | - | - | - | ✓ | ✓ |
| RAG Dashboard | - | - | - | - | - | ✓ | ✓ |
| Analytics | - | - | ✓ | - | - | ✓ | ✓ |
| Reports | - | - | ✓ | - | - | ✓ | ✓ |
| User Management | - | - | - | - | - | ✓ | ✓ |
| Lead Management | - | - | - | - | - | ✓ | ✓ |
| Audit Trail | - | - | - | ✓ | - | ✓ | ✓ |
| Configuration | - | - | - | - | - | ✓ | ✓ |
| Navigation Manager | - | - | - | - | - | - | ✓ |

---

## 6. Data Filtering by Context

### 6.1 Tables with Context Filtering

| Table | Filtered Fields | Inheritance |
|-------|-----------------|-------------|
| `contracts` | companyId, businessUnitId, locationId | Direct assignment |
| `sales_data` | companyId, businessUnitId, locationId | Inherited from matched contract |
| `contract_royalty_calculations` | companyId, businessUnitId, locationId | Inherited from parent contract |

### 6.2 Context Filtering Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA VISIBILITY RULES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IF user.isSystemAdmin = true                                    │
│  └── Show ALL data (bypass all filters)                          │
│                                                                  │
│  IF user.activeContext.role = 'admin' OR 'owner'                 │
│  └── Show company data + legacy data (NULL context)              │
│                                                                  │
│  IF user.activeContext.locationId is set                         │
│  └── Show only data matching that location                       │
│                                                                  │
│  IF user.activeContext.businessUnitId is set (no location)       │
│  └── Show all data within that business unit                     │
│                                                                  │
│  IF user.activeContext.companyId is set (no BU/location)         │
│  └── Show all data within that company                           │
│                                                                  │
│  ELSE (no context assigned)                                      │
│  └── Show ALL data (backward compatibility)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Legacy Data Handling

**Legacy contracts** (created before org-context was implemented) have:
- `companyId = NULL`
- `businessUnitId = NULL`  
- `locationId = NULL`

**Visibility rules for legacy data:**
- System Admin: Always visible
- Company Admin (admin/owner): Always visible
- Location/BU users: NOT visible (they only see explicitly assigned data)

---

## 7. Testing Scenarios

### 7.1 Navigation Permission Tests

#### Test Case NP-01: Default Access Behavior
**Objective:** Verify menu items show based on defaultRoles when no Enabled toggle is set

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new user with "analyst" role | User created |
| 2 | Login as the new analyst user | Login successful |
| 3 | Check sidebar navigation | Should see: Dashboard, Contracts, License Fee Rules, Royalty Calculator, Calculations, Sales Data, liQ AI, Analytics, Reports |
| 4 | Verify hidden items | Should NOT see: Upload Contract, Review Queue, ERP items, Knowledge Base, Admin items |

#### Test Case NP-02: Enabled Toggle Override
**Objective:** Verify Enabled toggle overrides Default Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin | Admin dashboard loads |
| 2 | Go to Configuration page | Nav permission table shows |
| 3 | Find "Upload Contract" row, "analyst" column | Default Access = OFF |
| 4 | Toggle Enabled = ON for analyst | Toggle turns green |
| 5 | Login as analyst user | Analyst dashboard loads |
| 6 | Check sidebar | "Upload Contract" NOW visible |

#### Test Case NP-03: Enabled Toggle OFF Hides Menu
**Objective:** Verify Enabled=OFF hides item even if Default Access=ON

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin | Admin dashboard loads |
| 2 | Go to Configuration page | Nav permission table shows |
| 3 | Find "Dashboard" row, "viewer" column | Default Access = ON |
| 4 | Toggle Enabled = OFF for viewer | Toggle turns gray |
| 5 | Login as viewer user | Login successful |
| 6 | Check sidebar | "Dashboard" NOT visible |

#### Test Case NP-04: User Override Priority
**Objective:** Verify user-specific override takes highest priority

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin | Admin dashboard loads |
| 2 | Go to User Management | User list shows |
| 3 | Edit a viewer user | User edit form opens |
| 4 | Add override: "Analytics" = Enabled | Override saved |
| 5 | Login as that viewer | Login successful |
| 6 | Check sidebar | "Analytics" visible (despite role not having default access) |

---

### 7.2 Context Hierarchy Tests

#### Test Case CH-01: Location-Level User
**Objective:** Verify location user sees only their location's data

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create user assigned to "Dayton, OR" location only | User created with location context |
| 2 | Create contract uploaded by this user | Contract saved with locationId = Dayton |
| 3 | Login as this user | Dashboard loads |
| 4 | Go to Contracts page | Only Dayton contracts visible |
| 5 | Go to Sales Data page | Only Dayton sales visible |
| 6 | Go to Calculations page | Only Dayton calculations visible |

#### Test Case CH-02: Business Unit-Level User
**Objective:** Verify BU user sees all locations within their BU

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create user assigned to "Monrovia Branded Division" BU | User has BU-level access |
| 2 | Create contracts for Dayton, Visalia, and Cairo locations | 3 contracts created |
| 3 | Login as BU user | Dashboard loads |
| 4 | Go to Contracts page | All 3 contracts visible (Dayton + Visalia + Cairo) |
| 5 | Contracts from "NC" or "OH" locations | NOT visible (different BU) |

#### Test Case CH-03: Company-Level User
**Objective:** Verify company user sees all data across all BUs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create user assigned to company-level | User has company access |
| 2 | Login as company user | Dashboard loads |
| 3 | Go to Contracts page | ALL company contracts visible |
| 4 | Should include | Branded BU (Dayton, Visalia, Cairo) + Non-Branded BU (NC, OH) |

#### Test Case CH-04: System Admin Bypass
**Objective:** Verify System Admin sees everything regardless of context

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as System Admin (admin / Admin@123!) | Admin dashboard loads |
| 2 | Go to Contracts page | ALL contracts from ALL companies visible |
| 3 | Go to Master Data | Can see/edit all companies, BUs, locations |
| 4 | Go to User Management | All users visible |

#### Test Case CH-05: Legacy Data Visibility
**Objective:** Verify legacy contracts (NULL context) visibility rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Identify contract with companyId = NULL | Legacy contract exists |
| 2 | Login as Company Admin | Dashboard loads |
| 3 | Go to Contracts page | Legacy contract IS visible |
| 4 | Login as Location-level user | Dashboard loads |
| 5 | Go to Contracts page | Legacy contract NOT visible |

---

### 7.3 Role-Specific Feature Tests

#### Test Case RF-01: Viewer Role Restrictions
**Objective:** Verify viewer has read-only access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as viewer | Dashboard loads |
| 2 | Navigate to Contracts | Contract list visible |
| 3 | Try to access /upload | Should be hidden from navigation |
| 4 | Try direct URL /upload | Access denied or redirect |
| 5 | Check for Edit/Delete buttons | Should NOT be present |

#### Test Case RF-02: Editor Contract Upload
**Objective:** Verify editor can upload contracts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as editor | Dashboard loads |
| 2 | Click "Upload Contract" in sidebar | Upload page loads |
| 3 | Upload a PDF contract | Contract uploaded successfully |
| 4 | Check contract in list | New contract appears with editor's context |

#### Test Case RF-03: Analyst Calculations
**Objective:** Verify analyst can perform calculations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as analyst | Dashboard loads |
| 2 | Navigate to Calculations | Calculation page loads |
| 3 | Select contract and run calculation | Calculation executes |
| 4 | View calculation results | Results displayed correctly |

#### Test Case RF-04: Auditor Audit Trail Access
**Objective:** Verify auditor can view audit logs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as auditor | Dashboard loads |
| 2 | Navigate to Audit Trail | Audit log page loads |
| 3 | View system events | Log entries visible |
| 4 | Try to modify logs | No modification capability |

#### Test Case RF-05: Admin Configuration Access
**Objective:** Verify admin can manage navigation permissions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin | Dashboard loads |
| 2 | Navigate to Configuration | Config page loads |
| 3 | Toggle permission for a role | Permission updates |
| 4 | Check affected user's sidebar | Sidebar reflects change |

#### Test Case RF-06: Owner Navigation Manager
**Objective:** Verify only owner can access Navigation Manager

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin (not owner) | Dashboard loads |
| 2 | Check sidebar | Navigation Manager NOT visible |
| 3 | Login as owner | Dashboard loads |
| 4 | Check sidebar | Navigation Manager IS visible |
| 5 | Navigate to Navigation Manager | Advanced nav settings load |

---

### 7.4 Cross-Feature Integration Tests

#### Test Case INT-01: Contract Upload with Context Assignment
**Objective:** Verify uploaded contracts inherit uploader's context

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as user with Dayton location context | Dashboard loads |
| 2 | Upload new contract | Contract uploaded |
| 3 | Check contract in database | companyId, businessUnitId, locationId set to Dayton |
| 4 | Login as Visalia user | Different context |
| 5 | Check Contracts page | Dayton contract NOT visible |

#### Test Case INT-02: Sales Data Inherits Contract Context
**Objective:** Verify uploaded sales data inherits matched contract's context

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create contract with Dayton context | Contract exists |
| 2 | Upload sales data matched to that contract | Sales uploaded |
| 3 | Check sales_data table | Context fields inherited from contract |
| 4 | Login as Visalia user | Different context |
| 5 | Check Sales Data page | Dayton sales NOT visible |

#### Test Case INT-03: Calculations Inherit Contract Context
**Objective:** Verify calculations inherit parent contract's context

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run calculation on Dayton contract | Calculation saved |
| 2 | Check calculations table | Context fields inherited from contract |
| 3 | Login as different location user | Different context |
| 4 | Check Calculations page | Dayton calculations NOT visible |

---

## 8. Test User Credentials

### 8.1 Pre-Seeded Users

| Username | Password | Role | Context | Purpose |
|----------|----------|------|---------|---------|
| admin | Admin@123! | System Admin | ALL | Super user testing |
| charlie.test | 123456 | Company Admin | Monrovia (Company) | Company admin testing |

### 8.2 Recommended Test User Matrix

Create these users for comprehensive testing:

| Username | Role | Company | Business Unit | Location | Tests |
|----------|------|---------|---------------|----------|-------|
| viewer.dayton | viewer | Monrovia | Branded | Dayton, OR | RF-01, CH-01 |
| editor.visalia | editor | Monrovia | Branded | Visalia, CA | RF-02, INT-01 |
| analyst.branded | analyst | Monrovia | Branded | (BU-level) | RF-03, CH-02 |
| auditor.company | auditor | Monrovia | (Company) | (Company) | RF-04, CH-03 |
| manager.cairo | manager | Monrovia | Branded | Cairo, GA | General |
| admin.monrovia | admin | Monrovia | (Company) | (Company) | RF-05, CH-05 |
| owner.monrovia | owner | Monrovia | (Company) | (Company) | RF-06 |

---

## Appendix A: Quick Reference Cards

### Permission Check Cheat Sheet

```
Q: Will this user see this menu item?

1. Is user a System Admin?
   YES → They see EVERYTHING, stop here
   NO → Continue...

2. Does user have a personal override for this item?
   YES → Use that override value
   NO → Continue...

3. Has the Enabled toggle been set for this role + item?
   YES → Use the toggle value (ON=show, OFF=hide)
   NO → Continue...

4. Is the user's role in the item's defaultRoles array?
   YES → Show the menu item
   NO → Hide the menu item
```

### Context Filtering Cheat Sheet

```
Q: Will this user see this data record?

1. Is user a System Admin?
   YES → They see ALL data, stop here
   NO → Continue...

2. Is record's context NULL (legacy data)?
   YES + user is admin/owner → Show
   YES + user is not admin/owner → Hide
   NO → Continue...

3. Does user's location match record's location?
   YES → Show
   (if user has location context)

4. Does user's BU match record's BU?
   YES → Show
   (if user has BU-level context)

5. Does user's company match record's company?
   YES → Show
   NO → Hide
```

---

## Appendix B: Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Menu item not showing | Enabled toggle OFF | Check Configuration page |
| User sees too much data | Admin role bypasses filters | Verify user's actual role |
| Legacy contracts missing | Location user can't see NULL context | Assign admin role or backfill context |
| Permission changes not reflecting | Browser cache | Hard refresh (Ctrl+Shift+R) |
| New user missing menus | Role not in defaultRoles | Toggle Enabled ON in Configuration |

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Platform Version:** LicenseIQ Research Platform v1.0
