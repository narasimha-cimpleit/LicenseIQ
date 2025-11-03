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

## System Design Choices
The architecture emphasizes AI-native design, integrating AI capabilities throughout the platform. Asynchronous AI processing with free APIs is prioritized. A relational data model underpins core entities like Users, Contracts, Sales Data, and Payment Calculations. The platform is designed for enterprise readiness, supporting multi-entity operations, user management, complete audit trails, smart organization, and flexible data import.

## Performance Optimizations
- **Consolidated AI Extraction** (October 2025): Replaced 6 sequential Groq API calls with 1 comprehensive extraction call using `extractAllContractDataInOneCall()` method. Reduces contract processing time from 2+ minutes to ~20 seconds (6x speed improvement).
- **Defensive Numeric Validation**: Implemented `parseNumericValue()` helper to handle AI extraction edge cases where text values (e.g., "standard rate") are returned instead of numbers, preventing database type errors.
- **Enhanced JSON Recovery**: Improved `extractAndRepairJSON()` with HTML entity decoding, truncated response repair, and better error handling for malformed AI responses.
- **Flexible Territory Matching** (October 31, 2025): Enhanced rule matching logic to support abstract territory names ("Primary", "Secondary", "Domestic", etc.) in sales data, allowing proper matching against rules with specific geographic territories. Implemented in both `server/routes.ts` (formula-preview) and `server/services/dynamicRulesEngine.ts` (calculations).

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