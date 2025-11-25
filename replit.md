# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It automates contract processing, risk assessment, and compliance using AI, offering features like automated payment calculations, dynamic rule engines, and a RAG-powered Q&A system. The platform aims to reduce manual effort, provide actionable insights, and ensure revenue assurance for industries with complex licensing agreements through an "AI-Native" architecture.

# User Preferences

Preferred communication style: Simple, everyday language.

**Terminology Standards:**
- Use "License Fee" (NOT "Royalty") throughout the application
- Use "liQ AI" (NOT "Contract Q&A") for the RAG-powered assistant - Note: lowercase 'l', lowercase 'i', uppercase 'Q'

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui, incorporating animated gradients, sticky navigation, and a comprehensive menu. It includes an omnipresent AI assistant via a floating button. Design elements are inspired by DualEntry.com, support dark mode, and offer interactive charts for analytics. The application supports a multi-theme system with 12 unique color schemes. Consistent USA date formatting (MM/DD/YYYY) is applied across the platform.

## Technical Implementations
The frontend utilizes React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API with a layered service architecture. PostgreSQL, with Drizzle ORM and pgvector, serves as the primary database. File storage uses Multer. A dynamic contract processing system employs a knowledge graph database schema for AI-powered zero-shot extraction and human-in-the-loop validation. Performance is optimized with consolidated AI extraction calls, defensive numeric validation, enhanced JSON recovery from AI responses, flexible territory matching, safe date parsing, and updated HuggingFace API endpoints. Sales data upload supports flexible CSV column name variations with intelligent field normalization. Multi-location context switching is implemented for dynamic organizational context management, impacting navigation and permissions. Navigation management includes categorized, collapsible menus with user-customizable drag-and-drop reordering, persisted in the database.

## Feature Specifications
- **AI Contract Reading & Analysis**: Automated term extraction, risk assessment, and compliance using Groq API.
- **Multi-Source Contract Ingestion**: Supports various document formats and platforms.
- **AI-Powered ERP Field Mapping**: Dynamic field mapping with a fine-tuned LLaMA model for ERP integrations.
- **Dynamic Rule Engine Management**: AI-extracted and manually-created payment rules using FormulaNode JSON expression trees.
- **AI Sales Matching**: Semantic matching of sales data against contract embeddings with LLM validation.
- **Payment Calculation Dashboard**: Customizable calculations, run history, and professional PDF invoice generation, including a centralized Royalty Calculator.
- **RAG-Powered Document Q&A System**: AI-powered chat for contract inquiries with source citations.
- **Omnipresent AI Agent**: Global, context-aware AI assistant supporting both platform and contract-specific questions.
- **Security & Access Control**: Five-tier Role-Based Access Control (RBAC), secure session management, and audit logging.
- **Dynamic Contract Processing**: AI-powered pipeline for zero-shot entity extraction and knowledge graph construction.
- **Universal Contract Processing System**: AI extraction for all contract types and pricing structures.
- **Dynamic Rule Form Implementation**: Adapts fields based on selected rule type.
- **Expanded Payment Terms Extraction**: Extracts various payment-related clauses beyond royalties.
- **Contract Metadata Management**: AI auto-population, version control, and role-based approval workflows for contract metadata.
- **Universal ERP Catalog System**: Frontend-managed ERP configuration system supporting any ERP via dynamic catalog management.
- **LicenseIQ Schema Catalog**: Manageable standard schema system mirroring ERP Catalog architecture for data consistency.
- **AI Master Data Mapping**: AI-driven field mapping with universal ERP support and dual schema auto-population via dynamic catalog integration.
- **Comprehensive Contract Search**: Full content-based search across contract metadata, AI analysis data, royalty rules, user fields, and dates with RBAC enforcement.
- **User-Organization Role Management**: System for assigning users to organizations with role-based access control at company, business unit, and location levels.
- **Categorized Navigation System**: Intelligent database-driven menu organization with collapsible categories, user-customizable preferences, and persistent expand/collapse state per user.
- **Multi-Location Data Filtering**: Comprehensive hierarchical access control enforcing organizational context across ALL data tables (contracts, sales, calculations) with admin bypass, preventing cross-context data leakage.

## System Design Choices
The architecture emphasizes an AI-native design, integrating AI capabilities throughout. It prioritizes asynchronous AI processing with free APIs and uses a relational data model for core entities. The platform is designed for enterprise readiness, supporting multi-entity operations, user management, audit trails, and flexible data import.

## Multi-Location Context Filtering (Phase 4-5 Implementation)

**Overview:**
Complete data isolation system that enforces organizational context across all business entities, ensuring users only see data relevant to their active location/business unit/company context.

**Architecture:**

1. **Database Schema:**
   - Added `companyId`, `businessUnitId`, `locationId` fields to:
     - `contracts` table (nullable)
     - `sales_data` table (nullable, inherited from contract)
     - `contract_royalty_calculations` table (nullable, inherited from contract)

2. **Table-Agnostic Filter Builder:**
   - `buildOrgContextFilter()` function in `server/storage.ts`
   - Accepts column references and `OrgAccessContext` interface
   - Returns SQL filter conditions for hierarchical filtering
   - Supports Location → Business Unit → Company hierarchy
   - Reusable across all tables with org fields

3. **Storage Layer Updates:**
   - **Contracts:** `getContracts()`, `searchContracts()`, `getContract()`, `getContractsByUser()`
   - **Sales:** `getSalesDataByContract()`, `getAllSalesData()`
   - **Calculations:** `getContractRoyaltyCalculations()`, `getContractRoyaltyCalculation()`
   - All methods accept optional `context?: OrgAccessContext` parameter
   - Filters applied using `and(...filterConditions)` pattern

4. **Route Handlers:**
   - Context extracted from `req.user?.activeContext` (populated by authentication middleware)
   - Passed to all storage methods as optional parameter
   - No context = no filtering (backward compatible)

5. **Security Features:**
   - **Admin/Owner Bypass:** Users with `admin` or `owner` roles bypass all context filtering
   - **Hierarchical Access:** Location users see location data only; BU users see all locations in BU; Company users see all BU and locations
   - **No Data Leakage:** Verified through architect review - all query paths properly filtered
   - **Backward Compatibility:** Users without org assignments can still access data (no context applied)

6. **Search Security:**
   - Primary contract search query: ✅ Filtered
   - Rules-based search query: ✅ Filtered
   - Date-based search query: ✅ Filtered
   - Additional contracts fetch: ✅ Filtered
   - All secondary query paths verified to prevent cross-context data exposure

**Maintenance Scripts:**

1. **`server/scripts/backfill-org-context.ts`:**
   - Assigns org IDs to existing contracts based on uploader's primary org assignment
   - Cascades org IDs to sales data (inherited from matched contract)
   - Cascades org IDs to calculations (inherited from parent contract)
   - Safe to re-run (only updates NULL values)

2. **`server/scripts/create-test-data.ts`:**
   - Creates comprehensive multi-location test scenarios:
     - 2 companies, 3 business units, 4 locations
     - 4 test users with different access levels:
       - Alice (Location-level access) - sees 1 contract
       - Bob (Location-level access) - sees 1 contract
       - Charlie (BU-level access) - sees 2 contracts
       - Diana (Company-level access) - sees 3 contracts
   - Test data includes contracts, sales, and calculations
   - Validates hierarchical filtering works correctly

**Testing Scenarios:**
1. Location-scoped user sees only their location's data
2. BU-scoped user sees all locations within their BU
3. Company-scoped user sees all data across all BUs
4. Admin user bypasses all filters and sees everything
5. User without org assignments sees all data (backward compatible)

**Future Enhancements:**
- Add foreign key constraints to org fields (after backfill complete)
- Add indexes on org fields for query performance
- Extend pattern to other tables (rules, analytics, reports)
- Add UI indicators showing active context filter
- Add bulk org assignment tool for administrators

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: TypeScript-first ORM.

## AI Services
- **Groq API**: LLaMA model inference for contract analysis.
- **Hugging Face Embeddings**: For semantic search and vector generation.

## UI Components
- **Radix UI**: Accessible UI primitives.
- **shadcn/ui**: Pre-built components with TailwindCSS.
- **Recharts**: Charting library.

## Development Tools
- **Vite**: Modern build tool.
- **TypeScript**: Static type checking.

## Authentication & Session Management
- **Passport.js**: Authentication middleware.
- **connect-pg-simple**: PostgreSQL session store.

## File Processing
- **Multer**: File upload middleware.
- **html-pdf-node**: PDF generation.

## Utility Libraries
- **date-fns**: Date utility library.
- **React Hook Form**: Form management.
- **TanStack Query**: Data synchronization.
- **Wouter**: Client-side routing.
- **Zod**: Schema validation.