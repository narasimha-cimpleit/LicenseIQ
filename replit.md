# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated royalty calculation, risk assessment, and a RAG-powered Q&A system.

# Recent Changes (October 24, 2025)

## Enhanced: Architecture Diagram with Multi-Source Contract Ingestion, Reordered Flows, and Omnipresent AI Agent
- **Feature**: Comprehensive updates to interactive architecture diagram (97KB, 1,498 lines)
- **Multi-Source Contract Ingestion (Flow #1)**:
  - Expanded beyond PDF-only to include multiple contract sources
  - Added support for: DocuSign, HelloSign, Adobe Sign, PandaDoc, contract management systems (Icertis, Agiloft), email attachments, SFTP imports
  - Visual diagram shows 4 input channels converging into unified ingestion hub
  - Reflects modern enterprise contract workflows where contracts come from various platforms
- **Reordered Process Flows for Logical Workflow**:
  - Flow #1: Contract Upload & AI Analysis (multi-source ingestion)
  - Flow #2: Dynamic Rule Engine Management (MOVED from #4 - setup rules early!)
  - Flow #3: Sales Data Matching (moved from #2)
  - Flow #4: Royalty Calculation with HITL (moved from #3)
  - Flow #5: AI Q&A Process (RAG-Powered) - unchanged
  - Rationale: Rules should be configured BEFORE running calculations to reduce errors and rework
- **Flow of Thought Narrative**:
  - Added comprehensive introduction explaining the logical sequence of actual system usage
  - Explains why Rule Management comes early (foundational for accurate calculations)
  - Shows progression: Ingest contracts → Configure rules → Match sales → Calculate royalties → Ask questions
  - Helps users understand the platform's workflow at a glance
- **LicenseIQ AI Agent Omnipresence**:
  - Added prominent purple gradient banner explaining AI Agent is always available across entire platform
  - AI Agent availability callout added to EVERY process flow (5 flows total)
  - Flow-specific AI assistance examples:
    - Flow #1: "Ask questions during upload, validate contract terms"
    - Flow #2: "Get assistance with formula logic, suggest optimal royalty structures"
    - Flow #3: "Help with data formatting, resolve matching conflicts, explain confidence scores"
    - Flow #4: "Explain calculation logic, validate formula outputs, troubleshoot discrepancies"
    - Flow #5: "THIS IS the AI Agent - ask any question about contracts with natural language"
  - Demonstrates AI-Native architecture where AI is integrated throughout, not siloed in one feature
  - Added 🤖 emoji indicators throughout diagrams to reinforce AI presence
- **AI-Powered ERP Field Mapping (Tab 5)**:
  - Added comprehensive AI-powered dynamic field mapping section using custom LLaMA model
  - Updated Data Transformation Engine diagram to highlight AI field mapping (pink/magenta with 🤖 emoji)
  - Detailed 3-phase process: Training → Dynamic Mapping → Continuous Learning
  - Key benefits: Zero manual mapping, 95%+ accuracy, 2-3 hours setup (vs 2-3 weeks manual)
  - Real examples of SAP, Oracle, NetSuite field mappings with confidence scores
  - Technical architecture: Fine-tuned LLaMA 3.1 8B, Hugging Face embeddings, pgvector storage
  - Semantic understanding handles field name variations (SALES_AMT, Sale Amount, SalesTotal → sales_amount)
  - Human-in-the-Loop for uncertain cases (<0.7 confidence)
  - FREE implementation using Groq + Hugging Face free tiers
- **Files Changed**:
  - `ProjectDocs/diagrams/architecture-interactive.html`: 90KB → 97KB (+7KB new content, 1,498 lines)
  - Removed duplicate `architecture-interactive (copy).html`
- **Impact**:
  - Clear demonstration of multi-channel contract ingestion (enterprise readiness)
  - Logical flow order mirrors actual user workflows (better UX understanding)
  - AI Agent omnipresence shows platform is truly "AI-Native" not "AI-bolted-on"
  - Comprehensive ERP integration story with AI-powered zero-config field mapping
  - Professional technical documentation for customer presentations and sales
  - Addresses real pain points: multiple contract sources, complex ERP mappings, need for AI assistance
- **Status**: Complete and tested

## Enhanced (October 22, 2025): Comprehensive Landing Page with Full Feature Coverage
- **Feature**: Expanded professional landing page (775 lines) covering all app features with content from CimpleIT.com/licenseiq
- **Hero Section**:
  - CimpleIT tagline: "Reads contracts like a lawyer, calculates like an accountant"
  - Modern sticky navigation bar with LicenseIQ branding and login button
  - Animated gradient backgrounds and AI-Native badge
  - Dual CTAs: "Get Early Access" (beta program) and "Watch Demo"
  - Trust indicators: Groq LLaMA 3.1, Hugging Face, Enterprise Security
- **Complete Feature Showcase (8 Core Features)**:
  - AI Contract Reading (automated term extraction)
  - AI Sales Matching (semantic search with confidence scoring)
  - Royalty Calculator (volume tiers, seasonal adjustments, multi-party splits)
  - PDF Invoices (detailed and summary reports)
  - Contract Q&A Chat (RAG-powered with citations)
  - Rules Management (view, edit, create with source attribution)
  - Risk Assessment (compliance detection)
  - Analytics Dashboard (financial, compliance, strategic, performance insights)
- **Advanced Capabilities Section (6 Enterprise Features)**:
  - Multi-Entity Support (territory-based calculations, multi-currency)
  - User Management (5-tier RBAC: Owner, Admin, Editor, Viewer, Auditor)
  - Complete Audit Trail (SOX-compliant activity logging)
  - Smart Organization (CNT-YYYY-NNN contract numbers, version tracking)
  - Flexible Data Import (CSV/Excel with validation)
  - ERP Integration Ready (SAP, Oracle, NetSuite, QuickBooks, custom APIs)
- **Key Benefits Section**:
  - 95% time savings (10-40 hours → 30 minutes per quarter)
  - Eliminate $10K-$100K+ payment errors
  - Instant audit-ready compliance reports
  - 4-week setup vs 18-month enterprise solutions
  - $50K-$200K+ annual ROI
  - Enterprise impact stats card with metrics
- **Industries Section**:
  - Consumer Products (brand licensing)
  - Automotive OEMs (multi-tier supplier licensing)
  - Electronics (patent licensing)
  - Industrial Equipment (machinery licensing)
- **Pricing Tiers** (from CimpleIT.com):
  - Starter: $2,000/month (5 contracts, basic features)
  - Professional: $5,000/month (25 contracts, ERP integrations) - Most Popular
  - Enterprise: Custom pricing (unlimited contracts, full automation)
- **Beta Program Section**:
  - Q4 2025 limited beta launch
  - Benefits: Free trial, early bird discount, design input, case study partnership
  - "Get Early Access" CTA
- **Design Elements**:
  - DualEntry.com-inspired modern UI
  - Gradient backgrounds (blue-600 to indigo-600)
  - Animated elements (pulse effects, hover transitions, fade-in)
  - Responsive layout for mobile, tablet, desktop
  - Dark mode support throughout
  - shadcn/ui components with custom cards
- **Content Sources**:
  - CimpleIT.com/licenseiq: Tagline, pricing, industries, ROI metrics, beta program
  - LicenseIQ.ai: Value propositions and messaging
  - App features: All functionality from contracts, sales, royalties, Q&A, analytics, rules, audit
- **Files Changed**:
  - `client/src/pages/landing.tsx`: 775 lines (expanded from 464)
- **Impact**: 
  - Comprehensive feature coverage for all app capabilities
  - CimpleIT branding and messaging integrated
  - Clear pricing and beta program information
  - Professional first impression for manufacturing companies
  - No disruption to existing functionality
- **Status**: Complete and tested

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The frontend is built with React and TypeScript, using Vite, TailwindCSS, shadcn/ui, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. UI elements include enhanced contract number and source attribution displays, as well as a comprehensive 6-item navigation menu for clear workflow progression.

## Backend
The backend is an Express.js and TypeScript RESTful API server with a layered service architecture, secure session-based authentication using PostgreSQL and RBAC, and a comprehensive middleware pipeline. It handles automatic contract number generation in the format CNT-YYYY-NNN.

## Database
PostgreSQL is used as the primary database with Drizzle ORM for type-safe operations. It leverages the pgvector extension for vector similarity search of Hugging Face embeddings with HNSW indexing. Neon Database provides scalable, serverless hosting.

## File Management
Contract files are stored securely on the server's filesystem. Multer handles file uploads with validation and metadata tracking.

## AI Integration Services
The platform integrates Groq API (LLaMA 3.1 8B Instant) for contract analysis, summarization, validation, and NLP. Hugging Face Embeddings (BAAI/bge-small-en-v1.5) are used for semantic contract matching. The AI pipeline includes automated extraction of key terms, risk assessment, compliance checking, insight generation, and a semantic matching system for sales-to-contract pairing. All AI processing is asynchronous and uses free APIs. A robust `extractAndRepairJSON()` helper ensures proper parsing of AI responses.

## Security & Access Control
A five-tier Role-Based Access Control (RBAC) system (owner, admin, editor, viewer, auditor) provides granular permissions. Secure session management is handled in PostgreSQL, and comprehensive audit logging tracks user actions. Zod schema validation is applied across all API endpoints.

## Data Models & Schema
The system uses a relational data model with core entities like Users, Contracts, Contract Analysis, Sales Data, Royalty Calculations, and Audit Trails, with Drizzle ORM ensuring type safety.

## Rules Management System
The system supports both AI-extracted and manually-created royalty rules, stored as FormulaNode JSON expression trees or in dedicated columns. The UI smart-parses FormulaNode structures for volume tiers and seasonal adjustments, and a formula display shows calculation logic. The formula preview accurately merges data from FormulaNode and legacy columns, displaying complete volume tiers and seasonal adjustments, along with source attribution.

## Royalty Calculation Dashboard
Features include gradient metric cards, interactive charts (Recharts), and a formula preview system. Users can trigger calculations with custom date ranges, track run history, and generate professional PDF invoices (detailed and summary) using html-pdf-node. The workflow is contract-based, tying sales data to individual contracts.

## RAG-Powered Document Q&A System
An AI-powered chat interface uses Retrieval-Augmented Generation (RAG) for contract inquiries, employing Hugging Face embeddings for semantic search and Groq LLaMA for precise answers with confidence scoring. A smart fallback mechanism uses full contract analysis for low-confidence RAG results. Answers include source citations.

## AI-Driven Sales Matching Workflow
This workflow involves: contract upload & AI analysis, embedding generation and storage (pgvector), sales data import, semantic search to match sales data against contract embeddings, LLM validation of matches with confidence scores, automatic assignment for high-confidence matches, and flagging low-confidence matches for human review.

# External Dependencies

## Database Services
-   **Neon PostgreSQL**: Serverless PostgreSQL hosting.
-   **Drizzle ORM**: TypeScript-first ORM.

## AI Services
-   **Groq API**: LLaMA model inference for contract analysis.
-   **Hugging Face Embeddings**: For semantic search and vector generation.

## UI Components
-   **Radix UI**: Accessible UI primitives.
-   **shadcn/ui**: Pre-built components with TailwindCSS.
-   **Recharts**: Charting library.

## Development Tools
-   **Vite**: Modern build tool.
-   **TypeScript**: Static type checking.

## Authentication & Session Management
-   **Passport.js**: Authentication middleware.
-   **connect-pg-simple**: PostgreSQL session store.

## File Processing
-   **Multer**: File upload middleware.
-   **html-pdf-node**: PDF generation.

## Utility Libraries
-   **date-fns**: Date utility library.
-   **React Hook Form**: Form management.
-   **TanStack Query**: Data synchronization.
-   **Wouter**: Client-side routing.
-   **Zod**: Schema validation.