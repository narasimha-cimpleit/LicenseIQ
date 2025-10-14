# Overview

License IQ Research Platform is a SaaS web application built for intelligent contract management and analysis. The platform enables users to upload, process, and analyze legal contracts using AI-powered document analysis with Groq's LLaMA models. It features role-based access control, real-time contract processing, risk assessment, comprehensive analytics, and an automated royalty calculation system with beautiful visualizations.

# Recent Changes (October 14, 2025)

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

## Fixed: Base Rate Display Bug (2500% Issue)
- **Bug**: Formula preview was showing base rates incorrectly (e.g., $25.00 displayed as "2500.0%")
- **Root Cause**: Display logic always multiplied rates by 100, treating all rates as percentages
- **Fix**: Smart rate detection - values >1 show as currency ($25.00 per unit), values ≤1 show as percentage (2.5%)
- **Files Changed**: `client/src/components/formula-preview.tsx`

## Fixed: Global Fallback Rule Priority Bug
- **Bug**: "Organic Premium" global rule (no product categories) was matching ALL products, overriding specific formula-based rules
- **Root Cause**: Rules with empty categories were checked first due to priority ordering and faulty matching logic
- **Fix**: Two-phase matching algorithm - Phase 1 checks specific product rules first, Phase 2 falls back to global rules only if no match found
- **Files Changed**: `server/routes.ts` (formula preview matching logic)
- **Impact**: Now correctly applies specific tiered rates (e.g., Cascade Blue Hydrangea: $2.25→$1.95→$1.70) instead of global $25.00 fallback

## TypeScript Compilation Fixes for Vercel Deployment
- Fixed 27 TypeScript errors in `server/routes.ts`
- Added proper type assertions for AI-extracted rules (external Groq API responses)
- Fixed property name: `saleDate` → `transactionDate`
- Fixed JSONB type handling for `volumeTiers`, `seasonalAdjustments`, `territoryPremiums`
- Fixed ContractAnalysis properties extraction from `keyTerms` JSON field
- All LSP errors resolved - deployment ready

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript**: Modern component-based frontend with strict type safety for reliable development
- **Vite**: Fast build tool and development server with hot module replacement for efficient development workflow
- **TailwindCSS + shadcn/ui**: Utility-first CSS framework with pre-built component library ensuring consistent UI design
- **Wouter**: Lightweight client-side routing solution for single-page application navigation
- **TanStack Query**: Server state management with intelligent caching, background updates, and synchronization
- **React Hook Form + Zod**: Form state management with schema-based validation for robust data handling

## Backend Architecture
- **Express.js + TypeScript**: RESTful API server with modular route structure and type safety
- **Session-based Authentication**: Secure session management with PostgreSQL storage and role-based access control
- **Layered Service Architecture**: Clean separation of concerns with dedicated services for file handling, AI processing, and data access
- **Middleware Pipeline**: Comprehensive request processing including logging, authentication, error handling, and audit tracking

## Database Layer
- **PostgreSQL with Drizzle ORM**: Type-safe database operations using schema-first approach with automatic TypeScript generation
- **pgvector Extension**: Vector similarity search support for semantic contract matching using cosine distance
- **Contract Embeddings Storage**: Dedicated table for storing 384-dimensional Hugging Face embeddings with HNSW indexing for fast retrieval
- **Neon Database**: Serverless PostgreSQL deployment providing scalable cloud database hosting
- **Connection Pooling**: Efficient database connection management using @neondatabase/serverless driver
- **Migration System**: Version-controlled database schema changes with Drizzle migrations for reliable deployments

## File Management System
- **Local File Storage**: Contract files stored securely on server filesystem with organized directory structure
- **Multer Integration**: Robust multipart form data handling for file uploads with size and type validation
- **File Validation Pipeline**: Comprehensive security checks including file type verification, size limits, and content scanning
- **Metadata Tracking**: Complete file lifecycle management with upload tracking, processing status, and audit trails

## AI Integration Services
- **Groq API Integration**: LLaMA 3.1 8B Instant model for contract analysis, summarization, natural language processing, and contract validation (100% FREE)
- **Hugging Face Embeddings**: BAAI/bge-small-en-v1.5 model (384 dimensions) for semantic contract matching and similarity search (100% FREE, 1000 requests/hour)
- **Contract Analysis Pipeline**: Automated extraction of key terms, risk assessment, compliance checking, and insight generation
- **Semantic Matching System**: AI-driven contract matching using vector embeddings and cosine similarity for automatic sales-to-contract matching
- **LLM Validation Engine**: Groq LLaMA validation of contract matches with confidence scoring and reasoning explanations
- **Confidence Scoring**: AI model confidence levels and reliability metrics for extracted information validation
- **Human Review Workflow**: Low-confidence matches (<60%) automatically flagged for human review and correction
- **Asynchronous Processing**: Background job processing for large document analysis without blocking user interface
- **Zero-Cost AI**: Entire AI pipeline runs on FREE APIs (Groq + Hugging Face) with no usage limits for typical workloads

## Security & Access Control
- **Role-Based Access Control (RBAC)**: Five-tier permission system (owner, admin, editor, viewer, auditor) with granular access controls
- **Session Management**: Secure session storage in PostgreSQL with configurable timeouts and security headers
- **Comprehensive Audit Logging**: Complete activity tracking for compliance including user actions, IP addresses, and timestamps
- **Input Validation**: Zod schema validation across all API endpoints and form inputs for data integrity

## Data Models & Schema
The system uses a relational data model with core entities including Users (with role hierarchy), Contracts (with metadata and processing status), Contract Analysis (AI-generated insights and risk assessments), Sales Data (transaction records matched to contracts), Royalty Calculations (calculation results with breakdown details), and Audit Trails (complete activity logging). All entities are fully typed through Drizzle ORM schemas ensuring type safety from database to frontend.

## Rules Management System
- **Dual-Format Support**: System handles both AI-extracted and manually-created rules seamlessly
  - **AI-Extracted Rules**: Stored in `formula_definition` column as FormulaNode JSON expression trees
  - **Legacy Rules**: Stored in dedicated columns (`volume_tiers`, `base_rate`, `seasonal_adjustments`, etc.)
  - **Smart Parsing**: UI automatically extracts volume tiers and seasonal adjustments from FormulaNode structures
  - **Backward Compatibility**: Falls back to legacy columns if formula_definition is not present
- **Formula Display**: Mathematical expressions showing exact calculation logic with volume tiers, seasonal multipliers, and territory premiums
- **Inline Editing**: Add, edit, and delete rules directly in the page without dialog popups for streamlined workflow
- **Automatic Extraction**: AI extracts volume tiers, seasonal adjustments, and territory premiums from contract PDFs during upload
- **Formula Parsing**: extractVolumeTiersFromFormula() and extractSeasonalAdjustments() parse nested FormulaNode operands

## Royalty Calculation Dashboard
- **Beautiful Visualizations**: Gradient metric cards showing sales transactions, total sales, total royalty, and calculation history
- **Interactive Charts**: Bar charts for sales & royalty breakdown, pie charts for revenue distribution using Recharts library
- **Formula Preview**: Smart preview system showing which formulas will apply to sales data BEFORE calculation runs
  - Displays sample products with matched formula types (volume tiers, seasonal adjustments, etc.)
  - Shows active rules count, matched products, and unmatched products warnings
  - Reuses same matching logic as calculation engine for accuracy
  - Appears automatically after sales upload, before Calculate Royalties button
- **Calculation Workflow**: Users can trigger calculations with custom date ranges and calculation names
- **Calculation History**: Track all royalty calculation runs with status indicators (pending, approved, rejected)
  - Displays detailed sales data breakdown with product names, quantities, and amounts
  - Shows matched royalty rules and calculation explanations for each line item
- **PDF Invoice Generation**: Professional invoice downloads in two formats
  - **Detailed Invoice**: Complete line-by-line breakdown with products, quantities, rates, and amounts
  - **Summary Invoice**: High-level overview with totals, statistics, and confidence scores
  - Generated using html-pdf-node with branded HTML templates
  - One-click download buttons with FileDown and Download icons
- **Contract-Based Workflow**: Each contract has its own sales data and calculation history, accessible from the contract analysis page
- **Responsive Design**: Mobile-friendly dashboard with gradient backgrounds and modern UI design

## RAG-Powered Document Q&A System (100% FREE)
- **Intelligent Contract Assistant**: AI-powered chat interface to ask questions about your contracts using Retrieval-Augmented Generation (RAG)
- **Semantic Search**: Uses Hugging Face embeddings (BAAI/bge-small-en-v1.5) to find relevant contract sections based on your question
- **AI-Generated Answers**: Groq LLaMA generates precise answers from retrieved contract context with confidence scoring
- **Source Citations**: Each answer includes references to specific contracts and sections used to generate the response
- **Contract Filtering**: Ask questions about all contracts or filter to specific contracts for targeted analysis
- **Beautiful Chat UI**: Modern messaging interface with example questions sidebar and confidence badges
- **Audit Trail**: All Q&A interactions logged for compliance and review
- **Mobile-Responsive**: Gradient design matching platform aesthetics with smooth user experience

## AI-Driven Sales Matching Workflow (100% FREE APIs)
1. **Contract Upload & Analysis**: Contracts are uploaded and analyzed by Groq LLaMA to extract key terms, products, territories, and royalty rules
2. **Embedding Generation**: Hugging Face embeddings (BAAI/bge-small-en-v1.5) are automatically generated from contract summaries, product descriptions, territories, and rules
3. **Vector Storage**: 384-dimensional embeddings stored in PostgreSQL with pgvector extension and HNSW indexing for fast similarity search
4. **Sales Data Import**: Users upload sales CSV/Excel files without requiring manual vendor selection
5. **Semantic Search**: Each sales row is converted to an embedding and matched against contract embeddings using cosine similarity
6. **LLM Validation**: Top contract candidates are validated by Groq LLaMA with confidence scoring and reasoning
7. **Automatic Matching**: High-confidence matches (>60%) are automatically assigned; low-confidence matches are flagged for human review
8. **Human Review**: Users can review and correct low-confidence matches through the UI

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with automatic scaling and backup management
- **Drizzle ORM**: TypeScript-first ORM providing type-safe database operations and schema management

## AI Services
- **Groq API**: High-performance LLaMA model inference for contract analysis and natural language processing tasks

## UI Components
- **Radix UI**: Accessible, unstyled UI primitives for building consistent and accessible user interfaces
- **shadcn/ui**: Pre-built component library built on Radix UI with TailwindCSS styling

## Development Tools
- **Vite**: Modern build tool with fast development server and optimized production builds
- **TypeScript**: Static type checking for enhanced developer experience and code reliability

## Authentication & Session Management
- **Passport.js**: Authentication middleware with local strategy for username/password authentication
- **connect-pg-simple**: PostgreSQL session store for secure server-side session management

## File Processing
- **Multer**: File upload middleware for handling multipart/form-data and file validation

## Utility Libraries
- **date-fns**: Modern date utility library for formatting and manipulation
- **React Hook Form**: Performant forms with minimal re-renders and built-in validation
- **TanStack Query**: Powerful data synchronization for React applications