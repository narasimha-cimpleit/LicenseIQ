# Overview

License IQ Research Platform is a SaaS web application designed for intelligent contract management and analysis. It automates contract processing, risk assessment, and compliance checks using AI, offering features like automated payment calculations, dynamic rule engines, and a RAG-powered Q&A system. The platform aims to reduce manual effort, provide actionable insights, and ensure revenue assurance for industries with complex licensing agreements through an "AI-Native" architecture.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui, incorporating animated gradients, sticky navigation, and a comprehensive menu. It includes an omnipresent AI assistant via a floating button. Design elements are inspired by DualEntry.com, support dark mode, and offer interactive charts for analytics. Recent updates focused on industry-agnostic branding, refined payment terminology, enhanced early access sections, streamlined Royalty Calculator access, a compact header, and full mobile responsiveness for the authenticated app.

## Technical Implementations
The frontend utilizes React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API with a layered service architecture. PostgreSQL, with Drizzle ORM and pgvector, serves as the primary database. File storage uses Multer. A dynamic contract processing system employs a knowledge graph database schema for AI-powered zero-shot extraction and human-in-the-loop validation. Performance has been optimized with consolidated AI extraction calls, defensive numeric validation, enhanced JSON recovery from AI responses, flexible territory matching, safe date parsing, and updated HuggingFace API endpoints.

## Feature Specifications
- **AI Contract Reading & Analysis**: Automated term extraction, risk assessment, and compliance using Groq API.
- **Multi-Source Contract Ingestion**: Supports various document formats and platforms (PDF, DocuSign, CM systems, etc.).
- **AI-Powered ERP Field Mapping**: Dynamic field mapping with a fine-tuned LLaMA model for ERP integrations (SAP, Oracle, NetSuite).
- **Dynamic Rule Engine Management**: AI-extracted and manually-created payment rules using FormulaNode JSON expression trees.
- **AI Sales Matching**: Semantic matching of sales data against contract embeddings with LLM validation.
- **Payment Calculation Dashboard**: Customizable calculations, run history, and professional PDF invoice generation, including a centralized Royalty Calculator.
- **RAG-Powered Document Q&A System**: AI-powered chat for contract inquiries with source citations.
- **Omnipresent AI Agent**: Global, context-aware AI assistant.
- **Security & Access Control**: Five-tier Role-Based Access Control (RBAC), secure session management, and audit logging.
- **Dynamic Contract Processing**: AI-powered pipeline for zero-shot entity extraction and knowledge graph construction.
- **Universal Contract Processing System**: AI extraction for all contract types and pricing structures.
- **Dynamic Rule Form Implementation**: Adapts fields based on selected rule type.
- **Expanded Payment Terms Extraction**: Extracts various payment-related clauses beyond royalties.
- **Contract Metadata Management**: AI auto-population, version control, and role-based approval workflows for contract metadata.
- **Universal ERP Catalog System**: Frontend-managed ERP configuration system supporting any ERP via dynamic catalog management.
- **LicenseIQ Schema Catalog**: Manageable standard schema system mirroring ERP Catalog architecture for data consistency.
- **AI Master Data Mapping**: AI-driven field mapping with universal ERP support and dual schema auto-population via dynamic catalog integration.

## System Design Choices
The architecture emphasizes an AI-native design, integrating AI capabilities throughout. It prioritizes asynchronous AI processing with free APIs and uses a relational data model for core entities. The platform is designed for enterprise readiness, supporting multi-entity operations, user management, audit trails, and flexible data import.

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