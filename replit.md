# Overview

License IQ Research Platform is a SaaS web application for intelligent contract management and analysis. It enables users to upload, process, and analyze legal contracts using AI-powered document analysis. The platform aims to streamline contract workflows, reduce manual effort, and provide actionable insights through features like automated royalty calculation, risk assessment, and a RAG-powered Q&A system. The platform offers a comprehensive solution for contract management, revenue assurance, and compliance, targeting industries with complex licensing agreements. It emphasizes an "AI-Native" architecture, embedding AI assistance throughout the user experience, from multi-source contract ingestion and dynamic ERP field mapping to ubiquitous in-app AI Q&A.

# Recent Fix (October 24, 2025)

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