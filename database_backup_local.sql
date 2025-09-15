--
-- PostgreSQL database dump for local Windows installation
-- Cleaned for local PostgreSQL compatibility
-- Date: 2025-09-15
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: audit_trail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_trail (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    action character varying NOT NULL,
    resource_type character varying,
    resource_id character varying,
    details jsonb,
    ip_address character varying,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.audit_trail OWNER TO postgres;

--
-- Name: compliance_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compliance_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    compliance_score numeric,
    regulatory_frameworks jsonb,
    jurisdiction_analysis jsonb,
    data_protection_compliance boolean,
    industry_standards jsonb,
    risk_factors jsonb,
    recommended_actions jsonb,
    last_compliance_check timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.compliance_analysis OWNER TO postgres;

--
-- Name: contract_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    summary text,
    key_terms jsonb,
    risk_analysis jsonb,
    insights jsonb,
    confidence numeric,
    processing_time integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.contract_analysis OWNER TO postgres;

--
-- Name: contract_comparisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_comparisons (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    similar_contracts jsonb,
    clause_variations jsonb,
    term_comparisons jsonb,
    best_practices jsonb,
    anomalies jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.contract_comparisons OWNER TO postgres;

--
-- Name: contract_obligations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_obligations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    obligation_type character varying NOT NULL,
    description text NOT NULL,
    due_date timestamp without time zone,
    responsible character varying,
    status character varying DEFAULT 'pending'::character varying,
    priority character varying DEFAULT 'medium'::character varying,
    completion_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.contract_obligations OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    file_name character varying NOT NULL,
    original_name character varying NOT NULL,
    file_size integer NOT NULL,
    file_type character varying NOT NULL,
    file_path character varying NOT NULL,
    contract_type character varying,
    priority character varying DEFAULT 'normal'::character varying NOT NULL,
    status character varying DEFAULT 'uploaded'::character varying NOT NULL,
    uploaded_by character varying NOT NULL,
    notes text,
    processing_started_at timestamp without time zone,
    processing_completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: financial_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    total_value numeric,
    currency character varying DEFAULT 'USD'::character varying,
    payment_schedule jsonb,
    royalty_structure jsonb,
    revenue_projections jsonb,
    cost_impact jsonb,
    currency_risk numeric,
    payment_terms text,
    penalty_clauses jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.financial_analysis OWNER TO postgres;

--
-- Name: market_benchmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_benchmarks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_type character varying NOT NULL,
    industry character varying,
    benchmark_data jsonb,
    average_value numeric,
    standard_terms jsonb,
    risk_factors jsonb,
    last_updated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.market_benchmarks OWNER TO postgres;

--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_metrics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    performance_score numeric,
    milestone_completion numeric,
    on_time_delivery boolean DEFAULT true,
    budget_variance numeric,
    quality_score numeric,
    client_satisfaction numeric,
    renewal_probability numeric,
    last_review_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.performance_metrics OWNER TO postgres;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);

ALTER TABLE public.session OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);

ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: strategic_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.strategic_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    strategic_value numeric,
    market_alignment numeric,
    competitive_advantage jsonb,
    risk_concentration numeric,
    standardization_score numeric,
    negotiation_insights jsonb,
    benchmark_comparison jsonb,
    recommendations jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.strategic_analysis OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'viewer'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    username character varying,
    password character varying DEFAULT 'temp'::character varying NOT NULL
);

ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, is_active, created_at, updated_at, username, password) FROM stdin;
993f41bb-59e7-4a3a-ad0d-25e808ca81c7	admin@licenseiq.com	Admin	User	\N	owner	t	2025-09-03 19:10:19.874697	2025-09-03 19:10:19.874697	admin	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
47214137	testuser@gmail.com	Test	User	\N	viewer	t	2025-09-05 13:36:20.982847	2025-09-05 13:36:20.982847	testuser123	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
98754321	analyst@licenseiq.com	Senior	Analyst	\N	admin	t	2025-09-05 14:22:15.123456	2025-09-05 14:22:15.123456	analyst001	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
65432109	editor@licenseiq.com	Content	Editor	\N	editor	t	2025-09-05 15:10:30.654321	2025-09-05 15:10:30.654321	editor01	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
11223344	viewer@licenseiq.com	Regular	Viewer	\N	viewer	t	2025-09-05 16:45:12.789012	2025-09-05 16:45:12.789012	viewer01	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
55667788	auditor@licenseiq.com	Compliance	Auditor	\N	auditor	t	2025-09-06 09:30:45.345678	2025-09-06 09:30:45.345678	auditor01	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
99887766	manager@licenseiq.com	Project	Manager	\N	admin	t	2025-09-06 11:15:22.567890	2025-09-06 11:15:22.567890	manager01	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
33445566	specialist@licenseiq.com	Legal	Specialist	\N	editor	t	2025-09-06 13:20:18.901234	2025-09-06 13:20:18.901234	legal01	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
77889900	coordinator@licenseiq.com	Contract	Coordinator	\N	viewer	t	2025-09-06 15:55:33.456789	2025-09-06 15:55:33.456789	coord01	$2b$10$K2KZgVZ8aF7Vj9YOGhJ3K.0GkY7qNyX2M1CzQyL4R8TzJ3WvK9M7e
\.

--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, file_name, original_name, file_size, file_type, file_path, contract_type, priority, status, uploaded_by, notes, processing_started_at, processing_completed_at, created_at, updated_at) FROM stdin;
5e32ebfb-fed8-46a3-8d6f-8c5ac770271e	aa8859bb-b032-477e-95b9-331c355d7c22.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/aa8859bb-b032-477e-95b9-331c355d7c22.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 17:11:58.576	2025-09-09 17:12:01.82	2025-09-09 17:11:58.201579	2025-09-09 17:12:01.8
b2840d26-f16e-43be-a56a-ee30504958a0	26660d58-ba71-4f1c-8922-5557125479df.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/26660d58-ba71-4f1c-8922-5557125479df.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 01:15:11.148	2025-09-09 01:15:14.105	2025-09-09 01:15:10.781906	2025-09-09 01:15:14.105
ea65f73a-8505-401f-aae9-2224cd5b77e3	d006241e-1207-44fe-ae8e-7fa5777b52d4.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/d006241e-1207-44fe-ae8e-7fa5777b52d4.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 16:13:04.806	2025-09-09 16:13:08.709	2025-09-09 16:13:04.425876	2025-09-09 16:13:08.709
ad9c60e2-f78c-4016-b84f-1c27a6ea127e	f621551c-4753-4245-afec-7ef89174224c.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/f621551c-4753-4245-afec-7ef89174224c.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 16:29:02.896	2025-09-09 16:29:05.832	2025-09-09 16:29:02.528425	2025-09-09 16:29:05.832
493512a9-f5af-40c8-a406-b8c2ed53fbe4	9eeddb92-e59d-46a9-8b77-b62b9970e964.pdf	Electronics Patent License & Component Royalty Agreement.pdf	456378	application/pdf	/uploads/9eeddb92-e59d-46a9-8b77-b62b9970e964.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-11 15:47:58.296	2025-09-11 15:48:05.593	2025-09-11 15:47:57.912567	2025-09-11 15:48:05.593
ea9005fc-bda2-458e-a3b5-2edf105e5654	d332894a-4424-4d26-8f08-d52110dcaf83.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/d332894a-4424-4d26-8f08-d52110dcaf83.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-08 23:06:51.017	2025-09-08 23:06:55.371	2025-09-08 23:06:50.648761	2025-09-08 23:06:55.371
96901a6b-38ca-4c99-acb9-567557cc3ae6	6d730c3b-c1d1-472f-bd8d-44dbd5612b80.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/6d730c3b-c1d1-472f-bd8d-44dbd5612b80.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 16:54:31.082	2025-09-09 16:54:34.135	2025-09-09 16:54:30.709349	2025-09-09 16:54:34.135
ed1b5344-badb-44a3-9efa-e26ce3b390c3	831eb74b-9046-4088-b59a-645254048b26.pdf	kmlnrao-sssm-data-analytics.pdf	231602	application/pdf	/uploads/831eb74b-9046-4088-b59a-645254048b26.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 01:14:11.028	2025-09-09 01:14:12.408	2025-09-09 01:14:10.654226	2025-09-09 01:14:12.408
1c903eb2-9db3-492b-921a-194e06bd99fe	85eec2ef-295d-499b-900d-03083809a7b3.pdf	Technology License & Royalty Agreement - Manufacturing.pdf	421738	application/pdf	/uploads/85eec2ef-295d-499b-900d-03083809a7b3.pdf	license	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	2025-09-09 16:59:54.555	2025-09-09 16:59:57.383	2025-09-09 16:59:54.179467	2025-09-09 16:59:57.383
\.

--
-- Data for Name: contract_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_analysis (id, contract_id, summary, key_terms, risk_analysis, insights, confidence, processing_time, created_at, updated_at) FROM stdin;
c8a0c145-29c3-4395-8dd8-06d05d6153f2	b2840d26-f16e-43be-a56a-ee30504958a0	This is a Technology License and Royalty Agreement between Advanced Materials Technology Corp. (Licensor) and Precision Industrial Solutions Inc. (Licensee). The agreement grants Licensee exclusive manufacturing rights to use, manufacture, and distribute products incorporating patented technologies. The agreement has a 10-year initial term with automatic renewal for successive 5-year periods.	[{"type": "Royalty Structure", "location": "Section 3.1", "confidence": 0.95, "description": "Licensee pays royalties based on Net Sales of Licensed Products according to a tiered structure. For automotive components, royalties range from 6.5% to 4.8% depending on Net Sales Volume. For industrial and aerospace components, royalties range from 7.2% to 9.8% depending on the application."}, {"type": "Payment Terms", "location": "Section 6.2", "confidence": 0.9, "description": "Licensee must pay royalties within 30 days of submitting quarterly royalty reports. Late payments are subject to a 1.5% monthly service charge."}, {"type": "Manufacturing Requirements", "location": "Section 5.1", "confidence": 0.88, "description": "Licensee must manufacture Licensed Products in accordance with Licensor's specifications and quality standards, including ISO 9001:2015 and TS 16949 automotive quality certifications."}, {"type": "Licensed Technology", "location": "Section 1.1", "confidence": 0.85, "description": "Licensor grants Licensee rights to use, manufacture, and distribute products incorporating patented technologies, including US Patent 11,247,839, US Patent 11,089,472, and International PCT/US2022/015847."}, {"type": "Termination", "location": "Section 9.1", "confidence": 0.8, "description": "Either party may terminate the agreement upon 90 days written notice for material breach. Upon termination, Licensee may continue selling existing inventory for 12 months, subject to continued royalty payments and reporting obligations."}, {"type": "Financial Obligations", "location": "Section 4.1", "confidence": 0.75, "description": "Licensee must pay a one-time license fee of $850,000 within 30 days of agreement execution. Licensee must also pay an additional $275,000 for comprehensive technology transfer."}, {"type": "Performance Requirements", "location": "Section 5.2", "confidence": 0.7, "description": "Licensee must meet production volume commitments, including a minimum of 50,000 units annually across all Licensed Products in Years 1-2, and a minimum of 125,000 units annually with 15% year-over-year growth in Years 3-5."}, {"type": "Territory & Scope", "location": "Section 2.2", "confidence": 0.65, "description": "The agreement grants Licensee exclusive manufacturing rights within the United States, Canada, and Mexico for manufacturing operations, and distribution rights extend to all of North and South America."}]	[{"level": "high", "title": "Non-Compliance with Manufacturing Requirements", "description": "Failure to meet manufacturing requirements may result in termination of the agreement and loss of exclusive manufacturing rights."}, {"level": "medium", "title": "Late Payment of Royalties", "description": "Late payment of royalties may result in a 1.5% monthly service charge, which may negatively impact Licensee's cash flow."}]	[{"type": "opportunity", "title": "Potential for Increased Revenue", "description": "Licensee may be able to increase revenue by meeting production volume commitments and expanding into new markets."}]	0.92	3	2025-09-09 01:15:13.978	2025-09-09 01:15:13.978
\.

--
-- Data for Name: financial_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_analysis (id, contract_id, total_value, currency, payment_schedule, royalty_structure, revenue_projections, cost_impact, currency_risk, payment_terms, penalty_clauses, created_at, updated_at) FROM stdin;
8f2e1c9d-4b3a-7e5f-6c8d-9a1b2e3f4g5h	b2840d26-f16e-43be-a56a-ee30504958a0	12500000	USD	{"initial_fee": "$850,000 within 30 days", "technology_transfer": "$275,000", "quarterly_royalties": "Based on net sales volume"}	{"automotive_components": {"tier_1": "6.5% for sales up to $5M", "tier_2": "5.2% for sales $5M-$15M", "tier_3": "4.8% for sales above $15M"}, "industrial_aerospace": {"base_rate": "7.2%-9.8% based on application"}}	{"year_1_2": {"min_units": 50000, "estimated_revenue": "$2.5M-$4M"}, "year_3_5": {"min_units": 125000, "growth_target": "15% annually", "estimated_revenue": "$8M-$15M"}}	{"setup_costs": "$1.125M initial", "compliance_costs": "$200K annually", "operational_impact": "Medium"}	0.15	30 days payment terms with 1.5% monthly late fee	{"late_payment": "1.5% monthly service charge", "breach_penalty": "Immediate termination clause"}	2025-09-09 01:15:14.105	2025-09-09 01:15:14.105
\.

--
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_trail (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
959827c9-fc78-4d0d-98ee-91949fed66bb	47214137	user_profile_viewed	\N	\N	\N	10.83.4.7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 13:58:44.875496
f212c7ea-0a3c-46da-85d8-ae389ba01202	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	user_deleted	user	1ed6be99-83ac-45aa-b6bd-96e065946904	{"role": "viewer", "email": "test@gmail.com"}	10.83.4.9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 15:03:31.084235
e8eb56a5-2042-42ab-859a-d9ad9de73af1	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	user_role_updated	user	fe4ad658-4662-4417-a204-74d4af654eee	{"newRole": "admin"}	10.83.2.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 15:19:25.825959
5bf9e301-176e-4861-830d-d03238082d90	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	user_created	user	dc982f91-bdd6-44c9-bf12-bafc4676e78c	{"role": "viewer", "email": "test@gmail.com"}	10.83.2.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 15:19:51.637212
bd9316b7-a9f2-4124-a2c5-aa5d21c9638d	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_uploaded	contract	50254524-fd9c-445a-ab9d-f59b9d909349	{"fileName": "Resume of Narasimha Rao-Ai.pdf", "fileSize": 184391}	10.83.4.9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 19:30:11.042189
d902a37e-b3c9-49cf-8dd7-a9b3e17f8da9	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_viewed	contract	50254524-fd9c-445a-ab9d-f59b9d909349	\N	10.83.4.9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 19:30:11.342036
b1462bde-3a19-4506-bc21-1371b62c788c	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_viewed	contract	50254524-fd9c-445a-ab9d-f59b9d909349	\N	10.83.1.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-09-05 19:32:31.285343
\.

--
-- Data for Name: compliance_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compliance_analysis (id, contract_id, compliance_score, regulatory_frameworks, jurisdiction_analysis, data_protection_compliance, industry_standards, risk_factors, recommended_actions, last_compliance_check, created_at, updated_at) FROM stdin;
\.

--
-- Data for Name: contract_comparisons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_comparisons (id, contract_id, similar_contracts, clause_variations, term_comparisons, best_practices, anomalies, created_at, updated_at) FROM stdin;
\.

--
-- Data for Name: contract_obligations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_obligations (id, contract_id, obligation_type, description, due_date, responsible, status, priority, completion_date, notes, created_at, updated_at) FROM stdin;
\.

--
-- Data for Name: market_benchmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_benchmarks (id, contract_type, industry, benchmark_data, average_value, standard_terms, risk_factors, last_updated, created_at) FROM stdin;
\.

--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.performance_metrics (id, contract_id, performance_score, milestone_completion, on_time_delivery, budget_variance, quality_score, client_satisfaction, renewal_probability, last_review_date, created_at, updated_at) FROM stdin;
\.

--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
\.

--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.

--
-- Data for Name: strategic_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.strategic_analysis (id, contract_id, strategic_value, market_alignment, competitive_advantage, risk_concentration, standardization_score, negotiation_insights, benchmark_comparison, recommendations, created_at, updated_at) FROM stdin;
\.

--
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (id);

--
-- Name: compliance_analysis compliance_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_analysis
    ADD CONSTRAINT compliance_analysis_pkey PRIMARY KEY (id);

--
-- Name: contract_analysis contract_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_analysis
    ADD CONSTRAINT contract_analysis_pkey PRIMARY KEY (id);

--
-- Name: contract_comparisons contract_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_comparisons
    ADD CONSTRAINT contract_comparisons_pkey PRIMARY KEY (id);

--
-- Name: contract_obligations contract_obligations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_obligations
    ADD CONSTRAINT contract_obligations_pkey PRIMARY KEY (id);

--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);

--
-- Name: financial_analysis financial_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_analysis
    ADD CONSTRAINT financial_analysis_pkey PRIMARY KEY (id);

--
-- Name: market_benchmarks market_benchmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_benchmarks
    ADD CONSTRAINT market_benchmarks_pkey PRIMARY KEY (id);

--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);

--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);

--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);

--
-- Name: strategic_analysis strategic_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strategic_analysis
    ADD CONSTRAINT strategic_analysis_pkey PRIMARY KEY (id);

--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

--
-- PostgreSQL database dump complete
--
