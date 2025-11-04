# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated payment calculations, risk assessment, and a RAG-powered Q&A system. It offers a comprehensive solution for contract management, revenue assurance, and compliance, targeting industries with complex licensing agreements. The platform emphasizes an "AI-Native" architecture, embedding AI assistance throughout the user experience, from multi-source contract ingestion and dynamic ERP field mapping to ubiquitous in-app AI Q&A.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui. Key design elements include animated gradient backgrounds, sticky navigation, dual CTAs, and a comprehensive navigation menu. An omnipresent AI assistant is available via a floating button and slide-out chat panel across all authenticated pages. The design incorporates DualEntry.com-inspired aesthetics, dark mode support, and interactive charts for analytics. Recent updates include industry-agnostic branding, professional LicenseIQ logo integration, refined payment-focused terminology, enhanced early access section styling with professional scroll animations, streamlined Royalty Calculator access (October 2025), compact DualEntry-style landing page header with 64px height and 40px logo (November 2025), and complete mobile responsiveness for authenticated app (November 2025).

### Mobile Responsiveness (November 2025)
- **Responsive Sidebar**: Hidden on mobile by default, slides in from left with overlay when menu button is clicked
- **Mobile Menu Toggle**: Hamburger menu button in header (visible only on mobile/tablet)
- **Adaptive Layout**: Main content area removes left margin on mobile, uses full screen width
- **Responsive Header**: Compact design on mobile with icon-only buttons, full text on desktop
- **Flexible Footer**: Stacks vertically on mobile, horizontal layout on desktop with smaller logo
- **Touch-Friendly**: Appropriate spacing and button sizes for mobile interaction
- **Smooth Transitions**: Sidebar slides with 300ms animation and backdrop overlay for better UX

## Technical Implementations
The frontend uses React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API server with a layered service architecture. PostgreSQL serves as the primary database with Drizzle ORM and leverages the pgvector extension for vector similarity search. File storage is managed on the server's filesystem using Multer. A dynamic contract processing system utilizes a knowledge graph database schema with 10 new tables for AI-powered zero-shot extraction, supporting human-in-the-loop validation and dynamic rule synthesis.

## Feature Specifications
- **AI Contract Reading & Analysis**: Automated term extraction, risk assessment, compliance checking, and insight generation using Groq API.
- **Multi-Source Contract Ingestion**: Supports PDF, DocuSign, HelloSign, Adobe Sign, PandaDoc, contract management systems, email attachments, and SFTP.
- **AI-Powered ERP Field Mapping**: Dynamic field mapping with a fine-tuned LLaMA model, offering zero manual mapping and high accuracy for ERP integrations (SAP, Oracle, NetSuite).
- **Dynamic Rule Engine Management**: Supports AI-extracted and manually-created payment rules using FormulaNode JSON expression trees, with smart parsing for volume tiers and seasonal adjustments.
- **AI Sales Matching**: Semantic matching of sales data against contract embeddings using Hugging Face embeddings, with LLM validation and confidence scoring.
- **Payment Calculation Dashboard**: Customizable date range calculations, run history tracking, and professional PDF invoice generation. Centralized Royalty Calculator page (October 2025) provides 1-click navigation access, cross-contract calculation overview with summary statistics, detailed calculation views showing transaction breakdowns and applied rules, and quick-action buttons (View Details, Download Report, View Rules).
- **RAG-Powered Document Q&A System**: AI-powered chat interface for contract inquiries, providing precise answers with confidence scoring and source citations.
- **Omnipresent AI Agent**: A global AI Q&A assistant accessible from anywhere in the application, offering context-aware assistance.
- **Security & Access Control**: Five-tier Role-Based Access Control (RBAC), secure session management, and comprehensive audit logging.
- **Dynamic Contract Processing**: AI-powered pipeline for zero-shot entity extraction, knowledge graph construction, and dynamic rule synthesis from any contract format, with human-in-the-loop validation.
- **Universal Contract Processing System**: AI-powered extraction for all contract types (e.g., Sales, Service, Licensing, SaaS) and comprehensive pricing structures (e.g., Renewal Terms, Escalation Clauses, Termination Penalties, Usage-Based Pricing, Volume Discounts).
- **Dynamic Rule Form Implementation**: "Add/Edit Rule" form adapts fields based on selected rule type (e.g., Royalty/License Rule, Payment Term Rule).
- **Expanded Payment Terms Extraction**: Extracts various payment-related clauses beyond royalties, including `payment_schedule`, `payment_method`, `rate_structure`, `invoice_requirements`, `late_payment_penalty`, `advance_payment`, and `milestone_payment`.
- **Contract Metadata Management** (November 2025): Comprehensive contract metadata system with intelligent AI auto-population, full version control, and role-based approval workflows. Features include: **universal two-party system** with "Your Organization" and "Counterparty" fields working for all contract types (replaces role-specific terms like licensor/licensee); automatic extraction and population of contract parties, effective dates, contract type (14 predefined options via dropdown), and display name from uploaded contracts; complete version history with change tracking and JSONB snapshots; approval workflow with draft/pending/approved states, self-approval prevention, and admin override capability; approved versions automatically become active contract metadata with full field propagation; editable metadata form accessible via "Manage Metadata" button in contract analysis; smart metadata preservation (only populates empty fields, never overwrites user edits); role-based permissions (admin/owner approval rights); version history displays editor username and user ID for transparency.
- **Universal ERP Catalog System** (November 2025): **Frontend-managed ERP configuration system** supporting ANY ERP (Oracle, SAP, NetSuite, custom systems) through dynamic catalog management. Database architecture includes three core tables: `erp_systems` (vendor, name, version), `erp_entities` (master_data/transactional tables), and `erp_fields` (columns with data types). **ERP Catalog Management UI** provides comprehensive CRUD operations with tabbed interface (Systems/Entities/Fields), breadcrumb navigation, search/filter capabilities, and professional dialogs for all operations. **Predicate-based query invalidation** ensures instant UI refresh after mutations using `queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/endpoint' })` pattern for parameterized React Query caches. Pre-seeded with 5 major ERP systems (Oracle EBS 12.2, Oracle Fusion Cloud, SAP S/4HANA, SAP ECC 6.0, NetSuite 2024.1), 14 Oracle master data entities (Customers, Items, Suppliers, etc.), and 10 sample customer fields. Storage layer implements 15 new methods (getAllSystems, createSystem, updateSystem, deleteSystem, getEntitiesBySystem, createEntity, updateEntity, deleteEntity, getFieldsByEntity, createField, updateField, deleteField, getAllMappings, createMapping, deleteMapping). Backend provides 12 authenticated API endpoints with proper validation and error handling.
- **AI Master Data Mapping** (November 2025): AI-driven field mapping system with **universal ERP support** via dynamic catalog integration. Features include: **Groq LLaMA-powered intelligent mapping** with semantic field matching, confidence scoring (High ≥90%, Medium 70-89%, Low <70%), and transformation rule suggestions; **dynamic ERP/entity selection** from catalog using dropdown menus replacing hardcoded Oracle entities; **dual-pane schema input** for LicenseIQ source schema and dynamically-loaded ERP target schema with JSON validation; **complete CRUD operations** for mapping configurations with save, load, view, edit, and delete functionality; **mapping results table** displaying source-to-target field mappings with confidence badges and transformation rules; **export capability** for JSON mapping files; **tabbed interface** with "Generate Mapping" and "Saved Mappings" views; **full type safety** with TypeScript interfaces for FieldMapping, MappingResult, and SavedMapping; stored in master_data_mappings table with JSONB mapping results for flexible schema storage; accessible via sidebar navigation with Database icon; includes "Configure ERP Catalog" button linking to ERP Catalog page.

## System Design Choices
The architecture emphasizes AI-native design, integrating AI capabilities throughout the platform. Asynchronous AI processing with free APIs is prioritized. A relational data model underpins core entities like Users, Contracts, Sales Data, and Payment Calculations. The platform is designed for enterprise readiness, supporting multi-entity operations, user management, complete audit trails, smart organization, and flexible data import.

## Performance Optimizations
- **Consolidated AI Extraction** (October 2025): Replaced 6 sequential Groq API calls with 1 comprehensive extraction call using `extractAllContractDataInOneCall()` method. Reduces contract processing time from 2+ minutes to ~20 seconds (6x speed improvement).
- **Defensive Numeric Validation**: Implemented `parseNumericValue()` helper to handle AI extraction edge cases where text values (e.g., "standard rate") are returned instead of numbers, preventing database type errors.
- **Enhanced JSON Recovery**: Improved `extractAndRepairJSON()` with HTML entity decoding, truncated response repair, and better error handling for malformed AI responses.
- **Flexible Territory Matching** (October 31, 2025): Enhanced rule matching logic to support abstract territory names ("Primary", "Secondary", "Domestic", etc.) in sales data, allowing proper matching against rules with specific geographic territories. Implemented in both `server/routes.ts` (formula-preview) and `server/services/dynamicRulesEngine.ts` (calculations).
- **Date Parsing Safety** (November 4, 2025): Added `parseSnapshotDate()` helper in approval workflow to safely handle JSONB date conversion, preventing "value.toISOString is not a function" errors during version approval. Properly handles Date objects, ISO strings, and null/undefined values.
- **HuggingFace API Update** (November 4, 2025): Updated HuggingFace Inference API endpoint from deprecated `api-inference.huggingface.co` to `router.huggingface.co/hf-inference` to fix error 410 in RAG/embedding generation system during contract upload and Q&A queries.

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