# Overview

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