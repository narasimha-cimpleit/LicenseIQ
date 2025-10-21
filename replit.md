# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis.

# Recent Changes (October 21, 2025)

## Fixed: Formula Preview Volume Tiers & Seasonal Adjustments Not Displaying
- **Bug**: Formula Preview showing simple formulas like `royalty = quantity × $25.00` without volume tiers or seasonal adjustments, even though data existed in database
- **Root Cause**: API had two mutually exclusive code paths - FormulaNode parsing vs legacy column reading. When a rule had FormulaNode JSON (from AI extraction), it would ignore the manually-populated `volume_tiers` and `seasonal_adjustments` JSONB columns entirely
- **Fix**: Modified formula preview API to MERGE both data sources:
  1. First parse FormulaNode if present
  2. Then check legacy columns (volume_tiers, seasonal_adjustments, baseRate)
  3. If FormulaNode didn't extract tiers/adjustments, merge in legacy column data
  4. Regenerate calculation formula with complete merged data
- **Enhancement**: Added source provenance - API now returns `sourceSection` and `sourceText` to show where rules were extracted from in the contract
- **Frontend Update**: Added source section display with tooltip hover for full source text
- **Database Updates**: Recreated 6 royalty rules with proper metadata:
  - 3 volume tier rules (Organic Premium, Perennials, Ornamental Trees) with structured JSONB tiers
  - 3 seasonal adjustment rules (Spring +15%, Fall -5%, Winter +20%)
  - Added sourceSection (e.g., "Section 3: Royalty Terms & Payment Schedule - Table 3.1")
  - Added sourceText excerpts from contract
- **Files Changed**: 
  - `server/routes.ts` (lines 1346-1483): API merge logic and source fields
  - `client/src/components/formula-preview.tsx` (lines 198-202): Source display
- **Impact**: Formula Preview now displays:
  - Complete volume tier breakdowns with rate thresholds
  - Seasonal adjustment multipliers with percentages
  - Source attribution showing which contract section each rule came from
  - Proper calculation formulas incorporating all conditions
- **Note**: This fix enables both AI-extracted FormulaNode rules AND manually-created legacy column rules to coexist and display correctly

## Updated: End-to-End Demo Navigation Structure (October 15, 2025)
- **Enhancement**: Completely redesigned navigation in all 8 demo workflow files to reflect actual application flow
- **Navigation Items**: Added comprehensive 6-item menu structure:
  - Dashboard (home)
  - Upload (contract & sales uploads)
  - Contracts (contract management)
  - AI Analysis (analysis & matching processes)
  - Royalty Calc (royalty calculations & invoices)
  - Ask Contract (RAG-powered Q&A)
- **Workflow-Specific Highlighting**: Each demo step now highlights the relevant navigation item:
  - Step 1 (Contract Upload) → Upload
  - Step 2 (AI Analysis Processing) → AI Analysis
  - Step 3 (Analysis Results) → Contracts
  - Step 4 (Sales Upload) → Upload
  - Step 5 (AI Matching Progress) → AI Analysis
  - Step 6 (Royalty Dashboard) → Royalty Calc
  - Step 7 (Invoice Generation) → Royalty Calc
  - Step 8 (Contract Q&A) → Ask Contract
- **Files Changed**: All 8 HTML demo files in `end-to-end-mocks/` directory
- **Impact**: Demo materials now provide clear visual context for each workflow step, making it easier for viewers to understand which part of the application they're seeing

## Fixed: Formula Preview & Rules Management JSON Parsing Bug
- **Bug**: Formula Preview showing no products (0 instead of 5), Rules Management missing FormulaNode rules
- **Root Cause**: Groq API returning malformed JSON that failed to parse - JSON syntax errors, unquoted keys, trailing commas, Infinity values
- **Fix**: Added robust `extractAndRepairJSON()` helper method that:
  - Extracts JSON from responses with regex
  - Repairs common issues (trailing commas, single quotes, unquoted keys, Infinity/NaN values)
  - Normalizes whitespace and special characters
  - Returns fallback values on parse failure
- **Files Changed**: `server/services/groqService.ts` (added helper method at line 107, updated all JSON parsing methods)
- **Impact**: Product formula extraction, tier rules, payment rules, and special adjustments now parse successfully
- **Note**: Users need to re-upload contracts to trigger extraction with fixed parsing

## Fixed: Contract Q&A Answer Display Bug
- **Bug**: Contract Q&A showing API endpoint path `/api/rag/ask` instead of actual answer
- **Root Cause**: Frontend mutation not parsing JSON response - `apiRequest` returns Response object, not parsed data
- **Fix**: Added `.json()` call to parse response: `return response.json()`
- **Files Changed**: `client/src/pages/contract-qna.tsx` (line 59)
- **Impact**: Q&A now correctly displays AI-generated answers from Groq

## Enhanced: Contract Q&A with Smart Fallback
- **Enhancement**: Added intelligent fallback system when RAG confidence is low (<60%)
- **Feature**: System now automatically falls back to full contract analysis using Groq API when semantic search doesn't find strong matches
- **Impact**: Users always get answers to their questions instead of "not enough information" messages
- **How It Works**: 
  1. First tries semantic RAG search with embeddings
  2. If confidence < 60%, falls back to analyzing full contract with Groq
  3. Returns comprehensive answer with 75% confidence indicator
- **Files Changed**: `server/services/ragService.ts`

## Fixed: RAG Dashboard Empty Data Issue
- **Bug**: RAG Intelligence Dashboard showing "No data available" and 500 error - "contracts is not defined"
- **Root Cause**: Missing `contracts` table import from schema in routes.ts (needed for join query to get contract names)
- **Fix**: Added `contracts` to imports from @shared/schema
- **Files Changed**: `server/routes.ts` (line 20)
- **Impact**: RAG stats API now successfully returns:
  - Total embeddings count
  - Embeddings grouped by type (summary, key_terms, insights)
  - Recent embeddings with contract names
  - Average chunk size statistics

---

# Overview (Continued)

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis with Groq's LLaMA models. Key features include role-based access control, real-time contract processing, risk assessment, comprehensive analytics, and an automated royalty calculation system with visualizations. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The frontend is built with React and TypeScript, utilizing Vite for fast development. UI consistency is achieved with TailwindCSS and shadcn/ui, while Wouter handles client-side routing. TanStack Query manages server state with caching, and React Hook Form with Zod ensures robust form validation.

## Backend
The backend is an Express.js and TypeScript RESTful API server. It employs a layered service architecture for separation of concerns, secure session-based authentication with PostgreSQL storage and role-based access control (RBAC), and a comprehensive middleware pipeline for request processing, logging, and error handling.

## Database
PostgreSQL is used as the primary database with Drizzle ORM for type-safe operations. It leverages the pgvector extension for vector similarity search of Hugging Face embeddings, stored with HNSW indexing. Neon Database provides scalable, serverless hosting with connection pooling. A Drizzle migration system manages schema changes.

## File Management
Contract files are stored securely on the server's filesystem. Multer handles file uploads with validation, and a file validation pipeline ensures security. Metadata tracking is implemented for file lifecycle management.

## AI Integration Services
The platform integrates Groq API (LLaMA 3.1 8B Instant) for contract analysis, summarization, validation, and natural language processing. Hugging Face Embeddings (BAAI/bge-small-en-v1.5, 384 dimensions) are used for semantic contract matching. The AI pipeline includes automated extraction of key terms, risk assessment, compliance checking, and insight generation. A semantic matching system uses vector embeddings and cosine similarity for sales-to-contract matching, validated by LLMs with confidence scoring. Low-confidence matches are flagged for human review. All AI processing is designed to be asynchronous and utilizes free APIs.

## Security & Access Control
A five-tier Role-Based Access Control (RBAC) system (owner, admin, editor, viewer, auditor) provides granular permissions. Secure session management is handled in PostgreSQL. Comprehensive audit logging tracks all user actions for compliance. Zod schema validation is applied across all API endpoints and form inputs.

## Data Models & Schema
The system uses a relational data model with core entities such as Users, Contracts, Contract Analysis, Sales Data, Royalty Calculations, and Audit Trails. Drizzle ORM schemas ensure type safety across the application stack.

## Rules Management System
The system supports both AI-extracted and manually-created royalty rules. AI-extracted rules are stored as FormulaNode JSON expression trees, while legacy rules are managed in dedicated columns. The UI smart-parses FormulaNode structures for volume tiers and seasonal adjustments, maintaining backward compatibility. A formula display shows calculation logic, and inline editing is supported.

## Royalty Calculation Dashboard
Features include gradient metric cards, interactive charts (Recharts), and a formula preview system that accurately shows applicable rules before calculation. Users can trigger calculations with custom date ranges, and a history tracks all runs with status and detailed breakdowns. Professional PDF invoices (detailed and summary) can be generated using html-pdf-node. The workflow is contract-based, with sales data and history tied to individual contracts.

## RAG-Powered Document Q&A System
An AI-powered chat interface uses Retrieval-Augmented Generation (RAG) for contract inquiries. It employs Hugging Face embeddings for semantic search and Groq LLaMA for generating precise answers with confidence scoring. A smart fallback mechanism uses full contract analysis for low-confidence RAG results. Answers include source citations, and users can filter questions by specific contracts.

## AI-Driven Sales Matching Workflow
This workflow involves:
1.  **Contract Upload & Analysis**: Groq LLaMA extracts key terms and rules.
2.  **Embedding Generation**: Hugging Face embeddings are created from contract details.
3.  **Vector Storage**: Embeddings are stored in PostgreSQL with pgvector.
4.  **Sales Data Import**: Users upload sales CSV/Excel files.
5.  **Semantic Search**: Sales data is matched against contract embeddings.
6.  **LLM Validation**: Groq LLaMA validates top matches with confidence scores.
7.  **Automatic Matching**: High-confidence matches are assigned automatically.
8.  **Human Review**: Low-confidence matches are flagged for manual review.

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

## Development Tools
-   **Vite**: Modern build tool.
-   **TypeScript**: Static type checking.

## Authentication & Session Management
-   **Passport.js**: Authentication middleware.
-   **connect-pg-simple**: PostgreSQL session store.

## File Processing
-   **Multer**: File upload middleware.

## Utility Libraries
-   **date-fns**: Date utility library.
-   **React Hook Form**: Form management.
-   **TanStack Query**: Data synchronization.