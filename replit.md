# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated royalty calculation, risk assessment, and a RAG-powered Q&A system.

# Recent Changes (October 22, 2025)

## Enhanced: Professional Landing Page & Auth Experience
- **Feature**: Created modern, professional landing page inspired by DualEntry.com design with LicenseIQ.ai content
- **Landing Page Features**:
  - Modern sticky navigation bar with LicenseIQ branding and login button
  - Eye-catching hero section with animated gradient backgrounds and AI-Native badge
  - Large, bold headline: "The AI-powered ERP for contract management"
  - Compelling subtitle with LicenseIQ.ai messaging about contract intelligence
  - Dual CTAs: "Get Started" (primary) and "Learn More" (secondary)
  - Trust indicators showing AI integrations (Groq LLaMA, Hugging Face, Enterprise Security)
  - Feature grid with 4 key capabilities (AI Analysis, Risk Assessment, Document Management, Analytics)
  - AI capabilities section highlighting 6 automation features with gradient icon cards
  - Benefits section with time savings, error elimination, and ROI metrics
  - Enterprise impact stats card (95% time reduction, $200K+ savings, 4-week deployment)
  - Professional footer with CimpleIT Inc branding
- **Design Elements**:
  - DualEntry.com-inspired modern UI with gradient backgrounds
  - Animated elements (pulse effects, hover transitions, fade-in animations)
  - Professional color scheme (blue-600 to indigo-600 gradients)
  - Responsive layout for mobile, tablet, and desktop
  - Dark mode support throughout
  - shadcn/ui components for consistency
- **Auth Page**:
  - Existing professional split-screen design preserved
  - Left: Sign In / Create Account tabs with modern forms
  - Right: Business benefits section with key value propositions
  - CimpleIT Inc branding integrated
  - Gradient backgrounds and professional styling maintained
- **Files Changed**:
  - `client/src/pages/landing.tsx`: Complete redesign with 400+ lines of modern UI
- **Impact**: 
  - Professional first impression for new users
  - Clear value proposition and feature showcase
  - Seamless navigation to auth page
  - No disruption to existing dashboard or app functionality
  - Existing auth system fully preserved
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