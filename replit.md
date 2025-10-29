# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated payment calculations, risk assessment, and a RAG-powered Q&A system. It offers a comprehensive solution for contract management, revenue assurance, and compliance, targeting industries with complex licensing agreements. The platform emphasizes an "AI-Native" architecture, embedding AI assistance throughout the user experience, from multi-source contract ingestion and dynamic ERP field mapping to ubiquitous in-app AI Q&A.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui. Key design elements include animated gradient backgrounds, sticky navigation, dual CTAs, and a comprehensive 6-item navigation menu. An omnipresent AI assistant is available via a floating button and slide-out chat panel across all authenticated pages. The design incorporates DualEntry.com-inspired aesthetics, dark mode support, and interactive charts for analytics. Recent updates include industry-agnostic branding, professional LicenseIQ logo integration, refined payment-focused terminology, and enhanced early access section styling with professional scroll animations.

## Technical Implementations
The frontend uses React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API server with a layered service architecture. PostgreSQL serves as the primary database with Drizzle ORM and leverages the pgvector extension for vector similarity search. File storage is managed on the server's filesystem using Multer. A dynamic contract processing system utilizes a knowledge graph database schema with 10 new tables for AI-powered zero-shot extraction, supporting human-in-the-loop validation and dynamic rule synthesis.

## Feature Specifications
- **AI Contract Reading & Analysis**: Automated term extraction, risk assessment, compliance checking, and insight generation using Groq API.
- **Multi-Source Contract Ingestion**: Supports PDF, DocuSign, HelloSign, Adobe Sign, PandaDoc, contract management systems, email attachments, and SFTP.
- **AI-Powered ERP Field Mapping**: Dynamic field mapping with a fine-tuned LLaMA model, offering zero manual mapping and high accuracy for ERP integrations (SAP, Oracle, NetSuite).
- **Dynamic Rule Engine Management**: Supports AI-extracted and manually-created payment rules using FormulaNode JSON expression trees, with smart parsing for volume tiers and seasonal adjustments.
- **AI Sales Matching**: Semantic matching of sales data against contract embeddings using Hugging Face embeddings, with LLM validation and confidence scoring.
- **Payment Calculation Dashboard**: Customizable date range calculations, run history tracking, and professional PDF invoice generation.
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