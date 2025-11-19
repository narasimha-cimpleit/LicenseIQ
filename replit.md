# Overview

License IQ Research Platform is a SaaS web application designed for intelligent contract management and analysis. It automates contract processing, risk assessment, and compliance checks using AI, offering features like automated payment calculations, dynamic rule engines, and a RAG-powered Q&A system. The platform aims to reduce manual effort, provide actionable insights, and ensure revenue assurance for industries with complex licensing agreements through an "AI-Native" architecture.

# User Preferences

Preferred communication style: Simple, everyday language.

**Terminology Standards:**
- Use "License Fee" (NOT "Royalty") throughout the application
- Use "liQ AI" (NOT "Contract Q&A") for the RAG-powered assistant - Note: lowercase 'l', lowercase 'i', uppercase 'Q'

# Recent Changes

- **Professional AI Answer Formatting** (2025-11-19): Redesigned liQ AI answer display with markdown-style formatting component. Features: automatic parsing of **bold text**, section headings (text ending with :), bullet points (- or •), numbered lists, and proper typography. Implemented consistent professional formatting across both main liQ AI page and floating liQ Agent. Updated RAG service prompts to eliminate robotic preambles ("Based on the provided sections...") and generate direct, consultant-grade responses with smart structure (headings, bullets, citations).
- **Branding Consistency - liQ** (2025-11-19): Standardized all AI-related branding to "liQ" (lowercase l, lowercase i, uppercase Q) across navigation, page titles, floating assistant, and database. Updated navigation_permissions table for consistency.
- **Multi-Theme System** (2025-01-14): Implemented comprehensive theming system with 12 unique color schemes: Light, Dark, Blue Ocean, Forest, Sunset, Purple Dream, Rose Gold, Midnight, Emerald, Mocha, Arctic, and Crimson. Each theme features custom color palettes for backgrounds, cards, buttons, and sidebars. Theme selector displays visual previews with gradient swatches, descriptions, and checkmarks. System theme auto-syncs with OS preferences. All selections persist in localStorage.
- **Sidebar UI Refinement** (2025-01-14): Removed user profile section from bottom of sidebar for cleaner design. User information now exclusively displayed in top-right dropdown menu with circular profile icon.
- **Blue Navigation Icons** (2025-01-14): Changed sidebar navigation icons from slate-gray to vibrant blue (blue-600 in light mode, blue-400 in dark mode) for better visual appeal and consistency with the app's color scheme.
- **Perfect Circular Profile Icon** (2025-01-14): Fixed profile icon to be a perfect 10x10px circle with solid blue-600 background, replacing the previous gradient design for a cleaner, more professional look.
- **Transparent Logo Background** (2025-01-14): Removed white background patch from logo area - logo now seamlessly blends with sidebar gradient backgrounds across all themes using CSS blend modes.
- **Chunked Contract Extraction** (2025-01-11): Implemented intelligent 3-chunk extraction for large contracts (>20k chars) - extracts from header (parties/dates), middle (30% position - detailed pricing), and tail (last 20k - pricing schedules). Deduplicates rules by normalized sourceSpan.text, keeping highest confidence entries. Solves "no rules generated" issue for large PDFs like Electronics Patent License.
- **System Knowledge Base for LIQ AI**: LIQ AI can now answer questions about the LicenseIQ platform itself, not just contract content. 11 documentation topics seeded covering platform features, contract types, AI services, calculations, security, deployment, etc.
- **RAG Dual-Source Routing**: Enhanced RAG service to intelligently route questions between contract documentation and platform documentation based on semantic similarity.
- **LIQ AI Example Questions UX**: Added 8 curated platform questions (blue-highlighted) and 5 essential contract questions in a compact, scrollable UI (400px max height) for better user experience.
- **Terminology Standardization**: Changed all "Royalty" references to "License Fee" across rules management (titles, labels, descriptions).
- **View Sources Bug Fix**: Fixed "[object Object]" display by adding proper string handling for sourceText field.
- **Enhanced Contract Display**: Contract dropdown now shows user-friendly format "CNT-2025-003 Plant Variety License & Royalty Agreement.pdf".

# System Architecture

## UI/UX Decisions
The platform features a modern, responsive UI built with React, TailwindCSS, and shadcn/ui, incorporating animated gradients, sticky navigation, and a comprehensive menu. It includes an omnipresent AI assistant via a floating button. Design elements are inspired by DualEntry.com, support dark mode, and offer interactive charts for analytics. Recent updates focused on industry-agnostic branding, refined payment terminology, enhanced early access sections, streamlined Royalty Calculator access, a compact header, and full mobile responsiveness for the authenticated app.

## Technical Implementations
The frontend utilizes React, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and React Hook Form with Zod for validation. The backend is an Express.js and TypeScript RESTful API with a layered service architecture. PostgreSQL, with Drizzle ORM and pgvector, serves as the primary database. File storage uses Multer. A dynamic contract processing system employs a knowledge graph database schema for AI-powered zero-shot extraction and human-in-the-loop validation. Performance has been optimized with consolidated AI extraction calls, defensive numeric validation, enhanced JSON recovery from AI responses, flexible territory matching, safe date parsing, and updated HuggingFace API endpoints. Sales data upload supports flexible CSV column name variations with intelligent field normalization (70+ aliases, case-insensitive, whitespace-tolerant) for better import compatibility.

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

# Deployment

## Production Deployment
Two comprehensive deployment guides are available for Hostinger VPS:

### 1. Command-Line Guide (`HOSTINGER_DEPLOYMENT_GUIDE.md`)
Complete terminal-based deployment guide covering:
- VPS setup and initial server configuration
- Node.js, PostgreSQL, and pgvector installation
- Application deployment with PM2 process manager
- Nginx reverse proxy configuration
- SSL certificate setup with Let's Encrypt
- Domain configuration and DNS setup
- Database backup and maintenance procedures
- Troubleshooting common issues

### 2. UI-Based Guide (`HOSTINGER_UI_DEPLOYMENT_GUIDE.md`)
Visual walkthrough using Hostinger's website interface (hPanel):
- Step-by-step UI navigation with screenshots descriptions
- Browser Terminal usage for all installations
- hPanel-based domain DNS configuration
- Visual firewall setup and snapshot management
- No SSH client required - everything through web browser
- Perfect for users preferring GUI over command-line

Both guides use:
- **Ubuntu 22.04/24.04** as the operating system
- **PM2** for process management and auto-restart
- **Nginx** as reverse proxy for production traffic
- **PostgreSQL 14+** with pgvector extension for vector embeddings
- **Let's Encrypt** for free SSL certificates