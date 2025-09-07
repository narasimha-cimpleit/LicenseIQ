# Overview

Licence IQ Research Platform is a SaaS web application built for intelligent contract management and analysis. The platform enables users to upload, process, and analyze legal contracts using AI-powered document analysis with Groq's LLaMA models. It features role-based access control, real-time contract processing, risk assessment, and comprehensive analytics for legal document management.

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
- **Neon Database**: Serverless PostgreSQL deployment providing scalable cloud database hosting
- **Connection Pooling**: Efficient database connection management using @neondatabase/serverless driver
- **Migration System**: Version-controlled database schema changes with Drizzle migrations for reliable deployments

## File Management System
- **Local File Storage**: Contract files stored securely on server filesystem with organized directory structure
- **Multer Integration**: Robust multipart form data handling for file uploads with size and type validation
- **File Validation Pipeline**: Comprehensive security checks including file type verification, size limits, and content scanning
- **Metadata Tracking**: Complete file lifecycle management with upload tracking, processing status, and audit trails

## AI Integration Services
- **Groq API Integration**: LLaMA 3.1 8B Instant model for contract analysis, summarization, and natural language processing
- **Contract Analysis Pipeline**: Automated extraction of key terms, risk assessment, compliance checking, and insight generation
- **Confidence Scoring**: AI model confidence levels and reliability metrics for extracted information validation
- **Asynchronous Processing**: Background job processing for large document analysis without blocking user interface

## Security & Access Control
- **Role-Based Access Control (RBAC)**: Five-tier permission system (owner, admin, editor, viewer, auditor) with granular access controls
- **Session Management**: Secure session storage in PostgreSQL with configurable timeouts and security headers
- **Comprehensive Audit Logging**: Complete activity tracking for compliance including user actions, IP addresses, and timestamps
- **Input Validation**: Zod schema validation across all API endpoints and form inputs for data integrity

## Data Models & Schema
The system uses a relational data model with core entities including Users (with role hierarchy), Contracts (with metadata and processing status), Contract Analysis (AI-generated insights and risk assessments), and Audit Trails (complete activity logging). All entities are fully typed through Drizzle ORM schemas ensuring type safety from database to frontend.

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