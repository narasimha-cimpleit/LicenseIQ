# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated payment calculations, risk assessment, and a RAG-powered Q&A system. It offers a comprehensive solution for contract management, revenue assurance, and compliance, targeting industries with complex licensing agreements. The platform emphasizes an "AI-Native" architecture, embedding AI assistance throughout the user experience, from multi-source contract ingestion and dynamic ERP field mapping to ubiquitous in-app AI Q&A.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Updates (October 27, 2025)

## Logo and Branding Enhancements
- Increased landing page navbar logo to h-14 (56px) for better visibility
- Dashboard sidebar logo: Increased to h-16 (64px), centered, with proper background integration
- Login page logo: Increased to h-16 size with clean white card container (rounded corners, shadow, border) for professional appearance

## Landing Page Animations
- Added professional scroll animations to feature cards with staggered fade-in effects
- Animated pricing cards with delayed entrance timing (700ms duration)
- Integration icons section: Staggered fade-in and zoom-in effects (8 icons with 50-450ms delays), hover scale effect (10% larger)

## Terminology and Compliance Updates
- Replaced "royalty/royalties" with professional payment-focused language ("payment calculations", "license fees")
- Added SOC 2 & GDPR compliance to all pricing plans with blue Shield icon for visual prominence

## Critical Bug Fix: Phantom Royalty Rules Eliminated (October 27, 2025)
Fixed critical bug where the system was generating phantom payment rules for contracts that don't contain royalty/license terms:

**Root Cause:**
- AI extraction prompts were biased toward licensing agreements
- Rule extractors ran unconditionally regardless of contract type
- Fallback values generated phantom data when extraction failed

**Solution Implemented:**
1. Rewrote contract analysis prompt to neutrally detect document type (service, subcontractor, employment, license, etc.)
2. Added `hasRoyaltyTerms` flag - only extracts rules when explicitly true
3. Implemented confidence threshold filtering (>= 0.6) and source text validation
4. Updated all rule extraction prompts with strict "Do NOT fabricate" instructions
5. Enhanced UI empty state to explain non-licensing contracts are normal
6. Added schema mapping to maintain compatibility with existing data model

**Impact:**
- Subcontractor agreements, service contracts, and other non-licensing documents now correctly show zero rules
- Contract party extraction is accurate (no longer forcing licensor/licensee labels)
- Rules engine is truly dynamic - only creates rules that actually exist in uploaded PDFs

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui. Key design elements include animated gradient backgrounds, sticky navigation, dual CTAs, and a comprehensive 6-item navigation menu. An omnipresent AI assistant is available via a floating button and slide-out chat panel across all authenticated pages. The design incorporates DualEntry.com-inspired aesthetics, dark mode support, and interactive charts for analytics. Recent updates include industry-agnostic branding, professional LicenseIQ logo integration, refined payment-focused terminology, and enhanced early access section styling with professional scroll animations.

## Technical Implementations
The frontend uses React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API server with a layered service architecture. PostgreSQL serves as the primary database with Drizzle ORM and leverages the pgvector extension for vector similarity search. File storage is managed on the server's filesystem using Multer. A dynamic contract processing system utilizes a knowledge graph database schema with 10 new tables for AI-powered zero-shot extraction, supporting human-in-the-loop validation and dynamic rule synthesis.

## Feature Specifications
-   **AI Contract Reading & Analysis**: Automated term extraction, risk assessment, compliance checking, and insight generation using Groq API.
-   **Multi-Source Contract Ingestion**: Supports PDF, DocuSign, HelloSign, Adobe Sign, PandaDoc, contract management systems, email attachments, and SFTP.
-   **AI-Powered ERP Field Mapping**: Dynamic field mapping with a fine-tuned LLaMA model, offering zero manual mapping and high accuracy for ERP integrations (SAP, Oracle, NetSuite).
-   **Dynamic Rule Engine Management**: Supports AI-extracted and manually-created payment rules using FormulaNode JSON expression trees, with smart parsing for volume tiers and seasonal adjustments.
-   **AI Sales Matching**: Semantic matching of sales data against contract embeddings using Hugging Face embeddings, with LLM validation and confidence scoring.
-   **Payment Calculation Dashboard**: Customizable date range calculations, run history tracking, and professional PDF invoice generation.
-   **RAG-Powered Document Q&A System**: AI-powered chat interface for contract inquiries, providing precise answers with confidence scoring and source citations.
-   **Omnipresent AI Agent**: A global AI Q&A assistant accessible from anywhere in the application, offering context-aware assistance.
-   **Security & Access Control**: Five-tier Role-Based Access Control (RBAC), secure session management, and comprehensive audit logging.
-   **Dynamic Contract Processing**: AI-powered pipeline for zero-shot entity extraction, knowledge graph construction, and dynamic rule synthesis from any contract format, with human-in-the-loop validation.

## System Design Choices
The architecture emphasizes AI-native design, integrating AI capabilities throughout the platform. Asynchronous AI processing with free APIs is prioritized. A relational data model underpins core entities like Users, Contracts, Sales Data, and Payment Calculations. The platform is designed for enterprise readiness, supporting multi-entity operations, user management, complete audit trails, smart organization, and flexible data import.

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