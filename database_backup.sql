-- PostgreSQL Database Backup for Licence IQ Research Platform
-- Generated on: 2025-09-09
-- Database contains: users, contracts, contract_analysis, audit_trail, sessions tables

-- Disable foreign key checks during restore
SET session_replication_role = replica;

-- Clean up existing data (use with caution)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS contract_analysis CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar UNIQUE,
    first_name varchar,
    last_name varchar,
    profile_image_url varchar,
    role varchar NOT NULL DEFAULT 'viewer',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    username varchar,
    password varchar NOT NULL DEFAULT 'temp'
);

-- Create contracts table
CREATE TABLE contracts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name varchar NOT NULL,
    original_name varchar NOT NULL,
    file_size integer NOT NULL,
    file_type varchar NOT NULL,
    file_path varchar NOT NULL,
    contract_type varchar,
    priority varchar NOT NULL DEFAULT 'normal',
    status varchar NOT NULL DEFAULT 'uploaded',
    uploaded_by varchar NOT NULL,
    notes text,
    flagged_for_review boolean DEFAULT false,
    processing_started_at timestamp,
    processing_completed_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create contract_analysis table
CREATE TABLE contract_analysis (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id varchar NOT NULL,
    summary text,
    key_terms jsonb,
    risk_analysis jsonb,
    insights jsonb,
    confidence numeric,
    processing_time integer,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Create audit_trail table
CREATE TABLE audit_trail (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar,
    action varchar NOT NULL,
    resource_type varchar,
    resource_id varchar,
    details jsonb,
    ip_address varchar,
    user_agent text,
    created_at timestamp DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create sessions table (for session storage)
CREATE TABLE sessions (
    sid varchar PRIMARY KEY,
    sess jsonb NOT NULL,
    expire timestamp NOT NULL
);

-- Create index on sessions expire column
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Insert users data
INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, is_active, created_at, updated_at, username, password) VALUES
('47214137', 'kmlnrao@yahoo.com', 'Narasimha', 'K', NULL, 'viewer', true, '2025-09-05 13:58:42.723944', '2025-09-05 13:58:42.723944', NULL, 'temp'),
('993f41bb-59e7-4a3a-ad0d-25e808ca81c7', 'admin@licenceiq.com', 'System', 'Administrator', NULL, 'admin', true, '2025-09-05 14:21:19.795215', '2025-09-05 14:21:19.795215', 'admin', 'ba8f14f711d9fc4778ed45c6828a2e847b0a17474e9456fc1156a07d0180c33d85bd21c9929ad37fecedf62eabb63b78209b8aeeae58c89aa66518be284c2966.c284ef4d946e44e4ed060ef6ba260cc5'),
('8430b90f-51ce-4b83-bcef-cfdebfb0aa35', 'owner@licenceiq.com', 'Company', 'Owner', NULL, 'owner', true, '2025-09-05 14:21:21.218866', '2025-09-05 14:21:21.218866', 'owner', 'b1de5549189f1c63520d5675aa2e28819259ae8368ab1e9abe5b0017b0234c5b8ff39e90e810aa7301cfe5518a939bd796273f628fea13abb42ba0474556c4bf.6610e82753cc28eabf487397eab7a0e7'),
('e8d057be-f50c-4097-ad01-34c6878ad68b', 'editor@licenceiq.com', 'Content', 'Editor', NULL, 'editor', true, '2025-09-05 14:21:22.560947', '2025-09-05 14:21:22.560947', 'editor', '63bf70e25094c038028b0913f3d6abc1f016c8d934e7d5f6ed2a6eceb9005d93f9c12c7c648c699e82f98cabb073cf01c3a23ade8949056a2891a7b85e772fb1.cd218db3174ffe9349d1d095f5e96401'),
('86ed9fd5-69bc-4751-a26b-0c7e79813e0f', 'viewer@licenceiq.com', 'Basic', 'Viewer', NULL, 'viewer', true, '2025-09-05 14:21:24.083283', '2025-09-05 14:21:24.083283', 'viewer', '7eb76e32d678866e16a1b36fee3e7f384b7f31bdf7ca5b3a9bd3505e5003919428d6596fd54c9990f3c938823b04215466c0ff9005c61ca53263106b642ffe9d.755a166f8b4b4df16f7aea8c3962341a'),
('fe4ad658-4662-4417-a204-74d4af654eee', 'auditor@licenceiq.com', 'Compliance', 'Auditor', NULL, 'admin', true, '2025-09-05 14:21:25.694389', '2025-09-05 15:19:25.732', 'auditor', 'ecadbb8955473d020ac6b8d47aa27171b39c3e2dc36a1b2987c9bc5da5e9b8038058ed75730d93d4bf7f6bb0ba7d5dbe4258d458e2d5267f59d0ffc072ca2c45.cc25703da5827206a688a516e3fbb1bd');

-- Insert contracts data
INSERT INTO contracts (id, file_name, original_name, file_size, file_type, file_path, contract_type, priority, status, uploaded_by, notes, flagged_for_review, processing_started_at, processing_completed_at, created_at, updated_at) VALUES
('b2840d26-f16e-43be-a56a-ee30504958a0', '26660d58-ba71-4f1c-8922-5557125479df.pdf', 'Technology License & Royalty Agreement - Manufacturing.pdf', 421738, 'application/pdf', '/home/runner/workspace/uploads/26660d58-ba71-4f1c-8922-5557125479df.pdf', 'license', 'normal', 'analyzed', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', NULL, false, '2025-09-09 01:15:11.148', '2025-09-09 01:15:14.105', '2025-09-09 01:15:10.781906', '2025-09-09 01:15:14.105'),
('8cc4e15c-7128-4770-a585-a913cd2e0ee0', '28629266-0fc4-41ea-952c-2510a22febbd.pdf', 'Technology License & Royalty Agreement - Manufacturing.pdf', 421738, 'application/pdf', '/home/runner/workspace/uploads/28629266-0fc4-41ea-952c-2510a22febbd.pdf', 'license', 'normal', 'analyzed', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', NULL, false, '2025-09-08 22:41:34.79', '2025-09-08 22:41:38.011', '2025-09-08 22:41:34.427772', '2025-09-08 22:41:38.011'),
('0a990662-74c5-4a0f-96d0-b548a9771f66', '9dcb3ea6-a55a-4150-ac63-6c890ec3a4d6.pdf', 'Technology License & Royalty Agreement - Manufacturing.pdf', 421738, 'application/pdf', '/home/runner/workspace/uploads/9dcb3ea6-a55a-4150-ac63-6c890ec3a4d6.pdf', 'license', 'normal', 'analyzed', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', NULL, false, '2025-09-08 22:59:43.301', '2025-09-08 22:59:45.835', '2025-09-08 22:59:42.93646', '2025-09-08 22:59:45.835');

-- Note: Additional contracts can be retrieved with separate queries due to data size

-- Insert contract analysis data
INSERT INTO contract_analysis (id, contract_id, summary, key_terms, risk_analysis, insights, confidence, processing_time, created_at, updated_at) VALUES
('c8a0c145-29c3-4395-8dd8-06d05d6153f2', 'b2840d26-f16e-43be-a56a-ee30504958a0', 'This is a Technology License and Royalty Agreement between Advanced Materials Technology Corp. (Licensor) and Precision Industrial Solutions Inc. (Licensee). The agreement grants Licensee exclusive manufacturing rights to use, manufacture, and distribute products incorporating patented technologies. The agreement has a 10-year initial term with automatic renewal for successive 5-year periods.', '[{"type": "Royalty Structure", "location": "Section 3.1", "confidence": 0.95, "description": "Licensee pays royalties based on Net Sales of Licensed Products according to a tiered structure. For automotive components, royalties range from 6.5% to 4.8% depending on Net Sales Volume. For industrial and aerospace components, royalties range from 7.2% to 9.8% depending on the application."}, {"type": "Payment Terms", "location": "Section 6.2", "confidence": 0.9, "description": "Licensee must pay royalties within 30 days of submitting quarterly royalty reports. Late payments are subject to a 1.5% monthly service charge."}, {"type": "Manufacturing Requirements", "location": "Section 5.1", "confidence": 0.88, "description": "Licensee must manufacture Licensed Products in accordance with Licensor''s specifications and quality standards, including ISO 9001:2015 and TS 16949 automotive quality certifications."}, {"type": "Licensed Technology", "location": "Section 1.1", "confidence": 0.85, "description": "Licensor grants Licensee rights to use, manufacture, and distribute products incorporating patented technologies, including US Patent 11,247,839, US Patent 11,089,472, and International PCT/US2022/015847."}, {"type": "Termination", "location": "Section 9.1", "confidence": 0.8, "description": "Either party may terminate the agreement upon 90 days written notice for material breach. Upon termination, Licensee may continue selling existing inventory for 12 months, subject to continued royalty payments and reporting obligations."}, {"type": "Financial Obligations", "location": "Section 4.1", "confidence": 0.75, "description": "Licensee must pay a one-time license fee of $850,000 within 30 days of agreement execution. Licensee must also pay an additional $275,000 for comprehensive technology transfer."}, {"type": "Performance Requirements", "location": "Section 5.2", "confidence": 0.7, "description": "Licensee must meet production volume commitments, including a minimum of 50,000 units annually across all Licensed Products in Years 1-2, and a minimum of 125,000 units annually with 15% year-over-year growth in Years 3-5."}, {"type": "Territory & Scope", "location": "Section 2.2", "confidence": 0.65, "description": "The agreement grants Licensee exclusive manufacturing rights within the United States, Canada, and Mexico for manufacturing operations, and distribution rights extend to all of North and South America."}]', '[{"level": "high", "title": "Non-Compliance with Manufacturing Requirements", "description": "Failure to meet manufacturing requirements may result in termination of the agreement and loss of exclusive manufacturing rights."}, {"level": "medium", "title": "Late Payment of Royalties", "description": "Late payment of royalties may result in a 1.5% monthly service charge, which may negatively impact Licensee''s cash flow."}]', '[{"type": "opportunity", "title": "Potential for Increased Revenue", "description": "Licensee may be able to increase revenue by meeting production volume commitments and expanding into new markets."}]', 0.92, 3, '2025-09-09 01:15:13.9789', '2025-09-09 01:15:13.9789');

-- Sample audit trail entries (first 10 entries)
INSERT INTO audit_trail (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) VALUES
('959827c9-fc78-4d0d-98ee-91949fed66bb', '47214137', 'user_profile_viewed', NULL, NULL, NULL, '10.83.4.7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-05 13:58:44.875496'),
('f212c7ea-0a3c-46da-85d8-ae389ba01202', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', 'user_deleted', 'user', '1ed6be99-83ac-45aa-b6bd-96e065946904', '{"role": "viewer", "email": "test@gmail.com"}', '10.83.4.9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-05 15:03:31.084235'),
('e8eb56a5-2042-42ab-859a-d9ad9de73af1', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', 'user_role_updated', 'user', 'fe4ad658-4662-4417-a204-74d4af654eee', '{"newRole": "admin"}', '10.83.2.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-05 15:19:25.825959'),
('5bf9e301-176e-4861-830d-d03238082d90', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', 'user_created', 'user', 'dc982f91-bdd6-44c9-bf12-bafc4676e78c', '{"role": "viewer", "email": "test@gmail.com"}', '10.83.2.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-05 15:19:51.637212'),
('e18e602f-cca3-4a9f-aeac-5308ea9101a1', '993f41bb-59e7-4a3a-ad0d-25e808ca81c7', 'user_deleted', 'user', 'dc982f91-bdd6-44c9-bf12-bafc4676e78c', '{"role": "viewer", "email": "test@gmail.com"}', '10.83.10.14', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-05 19:29:47.751916');

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Update sequences (if using serial columns)
-- Note: This backup uses varchar IDs with gen_random_uuid(), so no sequence updates needed

-- Final verification queries (uncomment to run after restore)
-- SELECT 'Users' as table_name, count(*) as record_count FROM users
-- UNION ALL
-- SELECT 'Contracts', count(*) FROM contracts  
-- UNION ALL
-- SELECT 'Contract Analysis', count(*) FROM contract_analysis
-- UNION ALL  
-- SELECT 'Audit Trail', count(*) FROM audit_trail;

-- End of backup file
-- To restore: psql -d your_database_name -f database_backup.sql

-- User Credentials (all users have password: admin123):
-- admin@licenceiq.com / admin123 (admin role)
-- owner@licenceiq.com / admin123 (owner role)  
-- editor@licenceiq.com / admin123 (editor role)
-- viewer@licenceiq.com / admin123 (viewer role)
-- auditor@licenceiq.com / admin123 (admin role)
-- kmlnrao@yahoo.com / temp (viewer role)