# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated royalty calculation, risk assessment, and a RAG-powered Q&A system. The platform offers a comprehensive solution for contract management, revenue assurance, and compliance, targeting industries with complex licensing agreements. It emphasizes an "AI-Native" architecture, embedding AI assistance throughout the user experience, from multi-source contract ingestion and dynamic ERP field mapping to ubiquitous in-app AI Q&A.

# Recent Changes

## October 27, 2025 - Branding Updates
- Updated landing page to be industry-agnostic: "Built for enterprise leaders" instead of "Built for manufacturing leaders"
- Replaced text-based navigation with professional LicenseIQ logo across all pages
- Removed "LicenseIQ" text next to logo in dashboard sidebar for cleaner appearance
- Updated PDF invoice footers with "Agentic AI for Financial Contracts" tagline
- Consistent logo-only branding throughout application (landing page, dashboard, auth pages)

## October 25, 2025 - Dynamic Contract Processing System

**Phase 1: Knowledge Graph Database Schema**
- Created 10 new tables for AI-powered dynamic contract extraction system
- Enables zero-shot learning for ANY contract format without predefined schemas
- Supports human-in-the-loop validation workflow with confidence scoring
- Tables added to PostgreSQL database:
  - `contract_documents` - Raw text segments with metadata and page numbers
  - `contract_graph_nodes` - Extracted entities (parties, products, terms, clauses) with semantic embeddings (384d vectors)
  - `contract_graph_edges` - Relationships between entities (applies_to, references, modifies, requires)
  - `extraction_runs` - AI extraction tracking with confidence, validation results, and processing time
  - `rule_definitions` - Dynamic royalty rules with FormulaNode JSON trees and applicability filters
  - `rule_node_definitions` - Registry of custom FormulaNode types with JSON schemas
  - `human_review_tasks` - Queue for low-confidence extractions requiring manual approval
  - `sales_field_mappings` - Learned associations between sales CSV columns and contract terms
  - `semantic_index_entries` - GraphRAG embeddings for enhanced document search
  - `rule_validation_events` - Audit trail for dimensional and AI consistency validation
- All tables use pgvector for semantic similarity search (384 dimensions for BAAI/bge-small-en-v1.5 embeddings)
- Schema is backward compatible - augments existing contract system without breaking changes
- File modified: `shared/schema.ts`

**Phase 2: Core AI Extraction Services**
- Built 5 production-ready services for dynamic contract processing:
  1. **documentOrchestratorService.ts** - Coordinates entire extraction pipeline with confidence scoring
  2. **zeroShotExtractionService.ts** - LLM-powered entity extraction without predefined schemas
  3. **knowledgeGraphService.ts** - Builds structured knowledge graphs with semantic embeddings
  4. **ruleSynthesisService.ts** - Dynamically generates FormulaNode trees from ANY contract type
  5. **validationService.ts** - Multi-layer validation (dimensional, consistency, business logic)
- Pipeline flow: PDF parsing → zero-shot extraction → graph building → rule synthesis → validation → review queue
- Confidence threshold: ≥70% auto-approve, <70% human review
- Files created: `server/services/documentOrchestratorService.ts`, `server/services/zeroShotExtractionService.ts`, `server/services/knowledgeGraphService.ts`, `server/services/ruleSynthesisService.ts`, `server/services/validationService.ts`

**Phase 3: API Endpoints and UI Integration**
- Added 9 secure API endpoints for dynamic extraction system:
  - POST `/api/contracts/:id/extract-dynamic` - Trigger dynamic extraction pipeline
  - GET `/api/extraction-runs/:id` - Get extraction run details
  - GET `/api/contracts/:id/extraction-runs` - List all extraction runs for a contract
  - GET `/api/contracts/:id/knowledge-graph` - Get knowledge graph (nodes + edges)
  - GET `/api/contracts/:id/dynamic-rules` - Get dynamically extracted rules
  - GET `/api/human-review-tasks` - List pending review tasks (admin/owner only)
  - PATCH `/api/human-review-tasks/:id/approve` - Approve extraction with authorization checks
  - PATCH `/api/human-review-tasks/:id/reject` - Reject extraction with required review notes
  - GET `/api/rules/:id/validation-events` - Get validation audit trail
- Implemented proper authorization: only assigned reviewers or admin/owner can approve/reject tasks
- Added input validation for all endpoints to prevent malformed data
- Created Human Review Queue UI page (`client/src/pages/HumanReviewQueue.tsx`) with:
  - Tabbed interface filtering by entity type (All, Entities, Relationships, Rules)
  - Confidence scoring visualization with color-coded priority badges
  - Side-by-side display of original data and AI-suggested corrections
  - Approve/reject workflow with review notes
  - Admin/owner-only access with navigation link in sidebar
- Files modified: `server/routes.ts`, `server/storage.ts`, `client/src/App.tsx`, `client/src/components/layout/sidebar.tsx`

**Phase 4: Contract Detail Page Integration**
- Integrated dynamic extraction trigger and results display into contract detail page
- Added "AI Extract" button to trigger zero-shot extraction pipeline directly from contract view
- Created extraction run history display showing:
  - Status badges (completed, processing, failed) with color coding
  - Confidence scores (0-100%) with correct percentage calculation
  - Entity and rule extraction counts
  - Validation issue warnings for low-confidence results
  - Relative timestamps ("2 hours ago" format)
- Dynamically extracted rules visualization:
  - Shows up to 3 rules with active vs pending review badges
  - Indicates total rule count with "+ N more rules" when applicable
  - Purple-themed UI to distinguish from manual rules
- Automatic cache invalidation: triggers refresh of both extraction runs and dynamic rules queries
- Production-ready implementation confirmed by architect review
- File modified: `client/src/pages/contract-analysis.tsx`

## October 24, 2025 - AI Agent UX Improvements

**Fixed: Sheet Overlay Opacity Issue**
- Reduced Sheet component overlay opacity from 80% to 20% (light mode) and 40% (dark mode)
- Background is now clearly visible when AI Agent panel is open
- Users can see their work context while chatting with AI
- File modified: `client/src/components/ui/sheet.tsx`

**Fixed: AI Panel Stays Open When Clicking Background**
- Made Sheet non-modal (`modal={false}`) so panel stays open when clicking outside
- Added pointer event prevention to keep panel open during background interaction
- Users can now interact with the background while keeping AI panel open
- Only closes when clicking the X button or the floating AI button again
- File modified: `client/src/components/floating-ai-assistant.tsx`

**Added: Auto-Scroll to Latest Answer**
- Chat window now automatically scrolls to the bottom when new messages arrive
- Smooth scroll animation for better UX
- Uses `useRef` and `useEffect` to track message updates
- Users can see the latest AI response without manual scrolling
- File modified: `client/src/components/floating-ai-assistant.tsx`

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui. Key design elements include animated gradient backgrounds, sticky navigation, dual CTAs, and a comprehensive 6-item navigation menu. An omnipresent AI assistant is available via a floating button and slide-out chat panel across all authenticated pages. The design incorporates DualEntry.com-inspired aesthetics, dark mode support, and interactive charts for analytics.

## Technical Implementations
The frontend uses React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API server with a layered service architecture. PostgreSQL serves as the primary database with Drizzle ORM and leverages the pgvector extension for vector similarity search. File storage is managed on the server's filesystem using Multer.

## Feature Specifications
-   **AI Contract Reading & Analysis**: Automated term extraction, risk assessment, compliance checking, and insight generation using Groq API.
-   **Multi-Source Contract Ingestion**: Supports PDF, DocuSign, HelloSign, Adobe Sign, PandaDoc, contract management systems, email attachments, and SFTP.
-   **AI-Powered ERP Field Mapping**: Dynamic field mapping with a fine-tuned LLaMA model, offering zero manual mapping and high accuracy for ERP integrations (SAP, Oracle, NetSuite).
-   **Dynamic Rule Engine Management**: Supports AI-extracted and manually-created royalty rules using FormulaNode JSON expression trees, with smart parsing for volume tiers and seasonal adjustments.
-   **AI Sales Matching**: Semantic matching of sales data against contract embeddings using Hugging Face embeddings, with LLM validation and confidence scoring.
-   **Royalty Calculation Dashboard**: Customizable date range calculations, run history tracking, and professional PDF invoice generation (detailed and summary).
-   **RAG-Powered Document Q&A System**: AI-powered chat interface for contract inquiries, providing precise answers with confidence scoring and source citations.
-   **Omnipresent AI Agent**: A global AI Q&A assistant accessible from anywhere in the application, offering context-aware assistance.
-   **Security & Access Control**: Five-tier Role-Based Access Control (RBAC), secure session management, and comprehensive audit logging.

## System Design Choices
The architecture emphasizes AI-native design, integrating AI capabilities throughout the platform rather than as isolated features. Asynchronous AI processing with free APIs is prioritized. A relational data model underpins core entities like Users, Contracts, Sales Data, and Royalty Calculations. The platform is designed for enterprise readiness, supporting multi-entity operations, user management, complete audit trails, smart organization, and flexible data import.

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