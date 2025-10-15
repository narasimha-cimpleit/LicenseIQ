--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_trail; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.audit_trail OWNER TO neondb_owner;

--
-- Name: compliance_analysis; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.compliance_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    compliance_score numeric(5,2),
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


ALTER TABLE public.compliance_analysis OWNER TO neondb_owner;

--
-- Name: contract_analysis; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contract_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    summary text,
    key_terms jsonb,
    risk_analysis jsonb,
    insights jsonb,
    confidence numeric(5,2),
    processing_time integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contract_analysis OWNER TO neondb_owner;

--
-- Name: contract_comparisons; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.contract_comparisons OWNER TO neondb_owner;

--
-- Name: contract_embeddings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contract_embeddings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    embedding_type character varying NOT NULL,
    source_text text NOT NULL,
    embedding public.vector(384),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contract_embeddings OWNER TO neondb_owner;

--
-- Name: contract_obligations; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.contract_obligations OWNER TO neondb_owner;

--
-- Name: contract_royalty_calculations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contract_royalty_calculations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    name character varying NOT NULL,
    period_start timestamp without time zone,
    period_end timestamp without time zone,
    status character varying DEFAULT 'pending_approval'::character varying,
    total_sales_amount numeric(15,2),
    total_royalty numeric(15,2),
    currency character varying DEFAULT 'USD'::character varying,
    sales_count integer,
    breakdown jsonb,
    chart_data jsonb,
    calculated_by character varying,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejected_by character varying,
    rejected_at timestamp without time zone,
    rejection_reason text,
    comments text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contract_royalty_calculations OWNER TO neondb_owner;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.contracts OWNER TO neondb_owner;

--
-- Name: financial_analysis; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.financial_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    total_value numeric(15,2),
    currency character varying DEFAULT 'USD'::character varying,
    payment_schedule jsonb,
    royalty_structure jsonb,
    revenue_projections jsonb,
    cost_impact jsonb,
    currency_risk numeric(5,2),
    payment_terms text,
    penalty_clauses jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.financial_analysis OWNER TO neondb_owner;

--
-- Name: market_benchmarks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.market_benchmarks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_type character varying NOT NULL,
    industry character varying,
    benchmark_data jsonb,
    average_value numeric(15,2),
    standard_terms jsonb,
    risk_factors jsonb,
    last_updated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.market_benchmarks OWNER TO neondb_owner;

--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.performance_metrics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    performance_score numeric(5,2),
    milestone_completion numeric(5,2),
    on_time_delivery boolean DEFAULT true,
    budget_variance numeric(10,2),
    quality_score numeric(5,2),
    client_satisfaction numeric(5,2),
    renewal_probability numeric(5,2),
    last_review_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.performance_metrics OWNER TO neondb_owner;

--
-- Name: royalty_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.royalty_rules (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    rule_type character varying NOT NULL,
    rule_name character varying NOT NULL,
    description text,
    product_categories text[],
    territories text[],
    container_sizes text[],
    seasonal_adjustments jsonb,
    territory_premiums jsonb,
    volume_tiers jsonb,
    base_rate numeric(15,2),
    minimum_guarantee numeric(15,2),
    calculation_formula text,
    priority integer DEFAULT 10,
    is_active boolean DEFAULT true,
    confidence numeric(5,2),
    source_section character varying,
    source_text text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    formula_definition jsonb,
    formula_version character varying DEFAULT '1.0'::character varying
);


ALTER TABLE public.royalty_rules OWNER TO neondb_owner;

--
-- Name: sales_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    matched_contract_id character varying,
    match_confidence numeric(5,2),
    transaction_date timestamp without time zone NOT NULL,
    transaction_id character varying,
    product_code character varying,
    product_name character varying,
    category character varying,
    territory character varying,
    currency character varying DEFAULT 'USD'::character varying,
    gross_amount numeric(15,2) NOT NULL,
    net_amount numeric(15,2),
    quantity numeric(12,4),
    unit_price numeric(15,2),
    custom_fields jsonb,
    import_job_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_data OWNER TO neondb_owner;

--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: strategic_analysis; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.strategic_analysis (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    strategic_value numeric(5,2),
    market_alignment numeric(5,2),
    competitive_advantage jsonb,
    risk_concentration numeric(5,2),
    standardization_score numeric(5,2),
    negotiation_insights jsonb,
    benchmark_comparison jsonb,
    recommendations jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.strategic_analysis OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_trail (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
5480e25b-6e10-4fc8-8541-bf7074beb078	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	f3b22140-51eb-4bb8-a6e0-685ee48c44fc	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.7.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 16:59:13.677776
b1dce8b2-c348-4237-afc0-12e463abf4cf	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "f3b22140-51eb-4bb8-a6e0-685ee48c44fc", "rowsImported": 15}	10.81.7.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:03:28.3537
992aa4f6-d782-4f6f-90db-30b616f07c74	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rule_updated	royalty_rule	72e50ccb-56ca-4955-8c61-487b67be432d	{"updates": {"baseRate": null, "priority": 1, "ruleName": "Aurora Flame Maple - 1-gallon with volume tiers", "ruleType": "formula_based", "description": "1-gallon containers: $1.25 per unit, $1.10 for 5000+ units with seasonal adjustments", "territories": ["Primary", "Secondary"], "volumeTiers": [{"max": 4999, "min": 0, "rate": 1.25, "label": "< 5000 units"}, {"max": null, "min": 5000, "rate": 1.1, "label": "5000+ units"}], "containerSizes": ["1-gallon"], "minimumGuarantee": null, "productCategories": ["Ornamental Trees"], "territoryPremiums": {}, "seasonalAdjustments": {"Fall": 0.95, "Spring": 1.1, "Summer": 1, "Holiday": 1.2}}, "contractId": "f3b22140-51eb-4bb8-a6e0-685ee48c44fc"}	10.81.0.33	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:05:07.810881
defc3796-6aa7-4485-b5d3-d59594f4ae00	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	4118fe02-2a39-474c-9cd6-84b5810bb722	{"fileSize": 421738, "originalName": "Technology License & Royalty Agreement - Manufacturing.pdf"}	10.81.0.33	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:06:04.235018
3cdc9c04-0327-486e-bf9f-0803702c9de6	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rule_updated	royalty_rule	85f71371-5fa1-4dbb-9398-499116ea60fa	{"updates": {"baseRate": null, "priority": 1, "ruleName": "Tier 1 — Ornamental Trees & Shrubs", "ruleType": "tiered_pricing", "description": "Plant Size CategoryRoyalty per UnitVolume Discount ThresholdDiscounted Rate\\n1-gallon containers$1.255,000+ units annually$1.10\\n3-gallon containers$2.852,000+ units annually$2.50\\n5-gallon containers$4.501,000+ units annually$3.95\\n15-gallon+ specimens$12.75200+ units annually$11.25", "territories": ["Primary Territory"], "volumeTiers": [{"max": 4999, "min": 0, "rate": 1.25}, {"min": 5000, "rate": 1.1}], "containerSizes": [], "minimumGuarantee": null, "productCategories": ["Ornamental Trees", "Shrubs"], "territoryPremiums": {}, "seasonalAdjustments": {}}, "contractId": "f3b22140-51eb-4bb8-a6e0-685ee48c44fc"}	10.81.6.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:11:53.878971
6df87b45-49e5-4da7-ac2b-cf662d4415bf	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	10b75927-b7a5-4bac-b611-b84ec16be08d	{"fileSize": 383171, "originalName": "Pharmaceutical Patent License & Drug Royalty Agreement.pdf"}	10.81.6.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:12:19.750451
ef39c071-849c-4939-8247-49432e92531a	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	9a97f4d8-d384-4123-862e-ca98b1f181a4	{"fileSize": 456378, "originalName": "Electronics Patent License & Component Royalty Agreement.pdf"}	10.81.7.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:14:43.720433
2835ffc5-19b6-429e-b139-3a764436e196	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	9a97f4d8-d384-4123-862e-ca98b1f181a4	{"fileName": "3e96f12f-e585-4ee8-9b49-b64dfc3544b8.pdf"}	10.81.6.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:15:46.163406
2f29a1a0-781c-4288-a7d0-8cde5988c50b	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	10b75927-b7a5-4bac-b611-b84ec16be08d	{"fileName": "5bf7a6ef-f250-475d-ab23-ea65d0af6e7b.pdf"}	10.81.7.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:15:56.381061
36329239-1059-4a1b-b2b5-cda18d33f884	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	4118fe02-2a39-474c-9cd6-84b5810bb722	{"fileName": "95ff603a-42b7-4eb9-8a29-2ccccc113467.pdf"}	10.81.7.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:15:58.515471
9971dd49-f407-4f79-bc45-580cbfaf60d9	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	f3b22140-51eb-4bb8-a6e0-685ee48c44fc	{"fileName": "4e92ec1e-1e7e-4dc9-8807-60281a2175df.pdf"}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:16:00.366243
8d8e0a0e-4679-4f8c-9e2f-80f1dd06f916	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	9c43b465-ae5b-4fa7-b3af-4e79c30ec50f	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:18:22.851813
da73dc29-e819-4887-bd39-321b9d20d364	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	9c43b465-ae5b-4fa7-b3af-4e79c30ec50f	{"fileName": "5a3b84ba-9d81-4151-9b24-163035834e03.pdf"}	10.81.8.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:26:16.6414
7640f11b-a9b2-488b-96e0-97aa67126d1f	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	712eca87-fa18-4a34-a7b5-29469202f1eb	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.8.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:26:28.295752
279bc29d-0b7f-4bc5-b061-638ff57a7069	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "712eca87-fa18-4a34-a7b5-29469202f1eb", "rowsImported": 15}	10.81.9.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:32:12.109683
22a6028e-4f58-4316-a706-7997512a080a	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	712eca87-fa18-4a34-a7b5-29469202f1eb	{"fileName": "c37cea2b-19ee-4ced-ae94-4414dbb0a828.pdf"}	10.81.0.33	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:51:17.997483
94cfb916-5d9b-4daf-ac91-78cea9a63bc9	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	01fde547-a1b2-4341-a24b-659c98e42edc	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:51:33.181126
cee0922a-ca63-488c-b7cc-43de72bc289d	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "01fde547-a1b2-4341-a24b-659c98e42edc", "rowsImported": 15}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:53:49.116684
dae1bd48-0d81-4720-adac-5564c89bf5f1	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	01fde547-a1b2-4341-a24b-659c98e42edc	{"fileName": "02de3426-39f3-472c-a0fb-5b3b4db22cf9.pdf"}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:59:07.584377
47a3790b-3390-4185-8f45-47face83e16a	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	1758543f-6cb3-45d2-ad18-1abefb1aaf95	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 17:59:26.113665
c46f8cfa-a63d-4853-a613-69d560574652	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "1758543f-6cb3-45d2-ad18-1abefb1aaf95", "rowsImported": 15}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 18:00:51.435125
37c20d98-947b-401c-8991-e53c0532e630	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_royalty_calculation	calculation	ed30a19c-4dd0-4bc1-bfc0-7c2185bb3069	{"contractId": "1758543f-6cb3-45d2-ad18-1abefb1aaf95", "contractName": "Plant Variety License & Royalty Agreement.pdf", "calculationName": "Q1 2024"}	10.81.7.95	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 20:07:09.568564
9fdaec97-0b1f-4b78-9f2c-79bf48e1b6c9	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What are the royalty rates?", "confidence": 0, "sourcesCount": 0}	10.81.7.95	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 20:07:39.384998
071ff5e0-7b6b-4900-9257-a4429dc881d7	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What are the payment terms?", "confidence": 0, "sourcesCount": 0}	10.81.7.95	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 20:07:49.030629
522538c1-81d7-4947-83c0-6313adf122d6	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What are the royalty rates?", "confidence": 0, "sourcesCount": 0}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 20:15:21.848138
b23ae851-80c0-4e0a-97a9-27105e65ba5a	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "Which territories are covered?", "confidence": 0, "sourcesCount": 0}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 20:15:34.653373
bfcbfdfe-ea84-4c5e-9f70-30fee860c538	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	1758543f-6cb3-45d2-ad18-1abefb1aaf95	{"fileName": "f54f0b43-6f76-4229-b05d-7d49a803db33.pdf"}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-13 22:30:17.097274
ba52b9a6-4294-4c23-89bf-3f16cb991da2	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	423de8ff-bfd5-4869-9dc4-350087d904cd	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:14:36.52226
cb7cb7c6-ff63-4d84-8091-7ed9064b7aff	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "423de8ff-bfd5-4869-9dc4-350087d904cd", "rowsImported": 15}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:15:40.957562
eb587bc7-8d54-43c1-9c4f-f2815a6032a1	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	423de8ff-bfd5-4869-9dc4-350087d904cd	{"fileName": "aaad1396-588e-4e09-b845-0cfe86ebcab2.pdf"}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:23:02.1282
0cc91dc3-cb25-477e-8587-117d2e510965	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	7f812882-ea64-4e26-a72e-d09651a201fc	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.6.44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:23:24.129337
fac2c221-9dc7-4370-bab0-617d6f807aa8	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "7f812882-ea64-4e26-a72e-d09651a201fc", "rowsImported": 15}	10.81.6.44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:24:37.258819
d1c20a75-6413-477c-8f75-47f72267f138	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	7f812882-ea64-4e26-a72e-d09651a201fc	{"fileName": "6c0e92a1-1ed4-4e8c-8bed-e3a642f411a0.pdf"}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:40:31.857241
c6b9186d-6826-4a8d-bae5-f00fc858d70b	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	46fcb371-8c9a-4f3b-ba92-b9857f3667e7	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:40:50.095878
a92e771b-90ce-4f23-a8f9-668be2e1166a	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data (2).csv", "contractId": "46fcb371-8c9a-4f3b-ba92-b9857f3667e7", "rowsImported": 15}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 18:41:33.58163
45fcfa92-f0cd-42d0-bcf0-2ac216923371	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	46fcb371-8c9a-4f3b-ba92-b9857f3667e7	{"fileName": "5774451e-70ee-44ee-a0dc-895611eec489.pdf"}	10.81.9.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:01:40.457561
292d1361-fced-43fb-9881-8dd582b31ef0	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	8018607c-c2fa-48fc-8936-6a28d1c0e464	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.9.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:01:47.486075
6091b4f1-810a-406f-8d85-6bea18278ee4	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	8018607c-c2fa-48fc-8936-6a28d1c0e464	{"fileName": "d8fa6887-aacc-4478-ba6c-7e2a03a86a4c.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:03:59.486886
d4108849-3f6b-4658-9760-22c10581fa83	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	b8984931-3bb0-4b5d-b8b3-467b3b145cc9	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:04:08.635314
070aa5b3-4836-4a59-bae4-ed605cd37c33	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	b8984931-3bb0-4b5d-b8b3-467b3b145cc9	{"fileName": "d3d2b41b-b6c8-43df-abe6-98ca1fa52e42.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:08:22.134411
6e2d9eb1-4d03-4f80-92cc-c3429266de55	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	81e29011-16f3-4bc0-9ee2-c24b8aa19419	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:08:34.059027
c64ed805-691b-4d61-98a0-c675dfbbaddf	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data.csv", "contractId": "81e29011-16f3-4bc0-9ee2-c24b8aa19419", "rowsImported": 15}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:10:42.59546
3c96d910-bf15-4695-a3ad-b8db2c5b48ba	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What are the royalty rates?", "confidence": 0.5034233651389687, "sourcesCount": 3}	10.81.10.86	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:16:03.846953
bed72af3-4087-4587-911c-bb4626e9ff09	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	user_role_update	user	deafebd3-22fb-4d7b-9426-f019c3203bce	{"previousRole": "unknown"}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:31:00.90492
8489edfb-244c-4d73-843c-ad51547d5080	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	81e29011-16f3-4bc0-9ee2-c24b8aa19419	{"fileName": "c47f0c85-4f30-41b4-b014-2d6b5baa1ff4.pdf"}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:31:34.928876
13ab58ef-a32f-4241-a8c5-f98c061c70a4	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	74a504c7-8a36-4e51-b31f-b06918800954	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:31:54.624735
6e47eb86-4608-4f19-b31c-907387f3a020	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data.csv", "contractId": "74a504c7-8a36-4e51-b31f-b06918800954", "rowsImported": 15}	10.81.5.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:33:41.329496
442eb0d6-24a6-4cd3-a14a-9661dbef86c0	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What products are included?", "confidence": 0.5282160153710113, "sourcesCount": 3}	10.81.3.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-14 22:35:15.862559
01610e4d-4324-4c76-b5bf-4afa7aa8b974	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	74a504c7-8a36-4e51-b31f-b06918800954	{"fileName": "379e9339-d146-4749-99fc-de81f9d792e5.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:09:18.557565
6b1d3533-2b51-406f-991b-c8bf2253263e	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	83fea764-9585-469c-ab3c-c612c19f204b	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:09:34.981571
56d4d85c-44ff-4958-8c86-ad40f410a3a4	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rule_updated	royalty_rule	0cb1aaf1-1b9a-4202-a425-295f6d7dd2d7	{"updates": {"baseRate": "-5.00", "priority": 3, "ruleName": "Fall Seasonal Discount", "ruleType": "tiered_pricing", "description": "seasonal discount for fall sales", "territories": [], "volumeTiers": [], "containerSizes": [], "minimumGuarantee": null, "productCategories": [], "territoryPremiums": {}, "seasonalAdjustments": {}}, "contractId": "83fea764-9585-469c-ab3c-c612c19f204b"}	10.81.0.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:10:35.608725
92e885ee-0d7e-4f88-847e-5d4dfefa4a96	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "Which territories are covered?", "confidence": 0.5159579765429815, "sourcesCount": 3}	10.81.0.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:11:58.254547
ca209ada-1628-49ea-977c-6829dfa37c30	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What are the royalty rates?", "confidence": 0.48869690732732307, "sourcesCount": 3}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:18:08.690493
5879e37f-c5f4-49c1-a4a8-7d355371b98b	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "Which territories are covered?", "confidence": 0.5159579765429815, "sourcesCount": 3}	10.81.1.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:18:16.949009
4506087b-9beb-49c6-82ae-99a23ce02bf7	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "Which territories are covered?", "confidence": 0.75, "sourcesCount": 3}	10.81.1.28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 15:23:46.310549
8aad807c-0cdf-49c7-8d2c-a72c1089ca37	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	83fea764-9585-469c-ab3c-c612c19f204b	{"fileName": "08a72163-c62a-4b9d-ae6a-3e110790cb6b.pdf"}	10.81.11.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 18:21:16.953123
b942165d-731a-44b2-8447-f28012a3e5af	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	f0be838a-ea40-4049-bfa7-9cfd5a1b4ec3	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.11.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 18:21:25.433953
99823d80-dc30-4196-9cdf-a05d99ac0346	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	upload_sales_data	sales	\N	{"fileName": "sample_sales_data.csv", "contractId": "f0be838a-ea40-4049-bfa7-9cfd5a1b4ec3", "rowsImported": 15}	10.81.3.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 18:22:57.143176
75af8bb0-ee7c-4bcf-8f7d-b18c01fdfe78	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	delete_contract	contract	f0be838a-ea40-4049-bfa7-9cfd5a1b4ec3	{"fileName": "bda42201-6cf1-446a-95f6-64b38b4c94fc.pdf"}	10.81.0.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 18:29:22.94415
50edacc9-a7eb-4813-add2-b137d547c05a	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	contract_upload	contract	500477ab-8c84-4e1e-8fbe-221cb5d67149	{"fileSize": 443464, "originalName": "Plant Variety License & Royalty Agreement.pdf"}	10.81.0.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 18:29:37.972504
f2d4f8bb-0114-4d54-b8e3-41c59094f89d	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "Which territories are covered?", "confidence": 0.75, "sourcesCount": 3}	10.81.4.28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 19:52:45.245914
ff960b10-f95e-4d81-990b-075219db1665	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What are the royalty rates?", "confidence": 0.75, "sourcesCount": 3}	10.81.4.28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 19:52:58.56398
a1016023-2a98-44c7-a185-1f80bcbeed08	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	rag_query	contract	all	{"question": "What products are included?", "confidence": 0.75, "sourcesCount": 3}	10.81.4.28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 19:53:18.908053
\.


--
-- Data for Name: compliance_analysis; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.compliance_analysis (id, contract_id, compliance_score, regulatory_frameworks, jurisdiction_analysis, data_protection_compliance, industry_standards, risk_factors, recommended_actions, last_compliance_check, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contract_analysis; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contract_analysis (id, contract_id, summary, key_terms, risk_analysis, insights, confidence, processing_time, created_at, updated_at) FROM stdin;
07553c43-109a-49fd-bb86-f93e0e5630a5	500477ab-8c84-4e1e-8fbe-221cb5d67149	This is a Plant Variety License & Royalty Agreement between Green Innovation Genetics LLC (Licensor) and Heritage Gardens Nursery & Landscaping (Licensee). The agreement grants exclusive regional plant variety rights to the Licensee for a period of 8 years with automatic renewal for successive 4-year periods. The Licensee must pay royalties based on Net Plant Sales, with varying rates depending on the type of plant and sales volume.	[{"type": "Royalty Structure", "location": "Section 3.1", "confidence": 0.95, "description": "The Licensee must pay royalties based on Net Plant Sales, with varying rates depending on the type of plant and sales volume. For example, for Tier 1 - Ornamental Trees & Shrubs, the royalty rate is $1.25 per unit for 1-gallon containers, with a discount rate of $1.10 per unit for 5,000+ units annually."}, {"type": "Payment Terms", "location": "Section 6.2", "confidence": 0.9, "description": "The Licensee must pay royalties within 45 days of the quarter end, with a late payment charge of 1.25% per month. The Licensee must also pay an annual certification and inspection fee of $12,500."}, {"type": "Manufacturing Requirements", "location": "Section 5.2", "confidence": 0.88, "description": "The Licensee must meet certain production standards, including genetic purity of 99.8% minimum, plant health of 95% survival rate, and size specifications that meet or exceed published standards for each container size."}, {"type": "Licensed Technology & Patents", "location": "Section 1.2", "confidence": 0.85, "description": "The Licensor grants the Licensee access to proprietary propagation methods covered by US Patent 11,456,892 and US Patent 11,234,567, as well as trade secret 'GreenGrow™ Nutrient Formula and Application Methods'."}, {"type": "Termination & Post-Termination", "location": "Section 9.1", "confidence": 0.8, "description": "Either party may terminate the agreement upon 180 days written notice for material breach, or upon 12 months notice for convenience. Upon termination, the Licensee may sell existing finished inventory for 18 months subject to continued royalty payments."}, {"type": "Financial Obligations", "location": "Section 4.1", "confidence": 0.85, "description": "The Licensee must pay an initial license fee of $125,000, as well as an annual certification and inspection fee of $12,500. The Licensee must also guarantee minimum annual royalty payments totaling $85,000."}, {"type": "Performance Requirements", "location": "Section 5.1", "confidence": 0.8, "description": "The Licensee must meet certain production volume commitments, including a minimum of 15,000 total plants across all varieties in Years 1-2, and a minimum of 50,000 total plants or market saturation targets in Years 5+."}, {"type": "Territory & Scope", "location": "Section 2.1", "confidence": 0.85, "description": "The agreement grants exclusive production and distribution rights to the Licensee within the Primary Territory of Oregon, Washington, Northern California, and Idaho, with non-exclusive rights in the Secondary Territory of Montana, Wyoming, Utah, and Nevada."}]	[{"level": "high", "title": "Non-Compliance with Manufacturing Requirements", "description": "If the Licensee fails to meet the manufacturing requirements, it may result in temporary production suspension and mandatory remedial training at the Licensee's expense."}, {"level": "medium", "title": "Late Payment Charges", "description": "If the Licensee fails to pay royalties within 45 days of the quarter end, it may result in late payment charges of 1.25% per month."}]	[{"type": "opportunity", "title": "Potential for Increased Sales", "description": "The Licensee has the opportunity to increase sales by meeting the production volume commitments and maintaining high-quality products."}, {"type": "alert", "title": "Risk of Non-Compliance", "description": "The Licensee must be aware of the risk of non-compliance with manufacturing requirements and late payment charges, and take steps to mitigate these risks."}]	0.92	0	2025-10-15 18:29:40.35565	2025-10-15 18:29:40.35565
\.


--
-- Data for Name: contract_comparisons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contract_comparisons (id, contract_id, similar_contracts, clause_variations, term_comparisons, best_practices, anomalies, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contract_embeddings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contract_embeddings (id, contract_id, embedding_type, source_text, embedding, metadata, created_at) FROM stdin;
115b92f0-8ce3-4aff-8538-5527e4d27f00	500477ab-8c84-4e1e-8fbe-221cb5d67149	insights	[object Object] [object Object]	[-0.0057210443,-0.027690887,-0.026362017,-0.05964637,-0.018033432,-0.023903359,0.024498649,-0.025197392,0.07785308,0.050947107,-0.04039741,-0.090128526,-0.010948332,-0.0025661692,0.024257403,-0.058444154,0.0047887745,0.05237017,-0.06599474,-0.030929899,0.10420531,-0.02872921,-0.049771894,-0.03240712,-0.01516336,0.09229761,-0.016579099,0.028423222,-0.021239558,-0.16478474,-0.050401725,-0.0076541,-0.03385015,0.02916894,0.023839476,0.0038802868,0.0059751663,0.045877986,-0.08392884,0.06081424,0.054558147,0.008995479,-0.03714113,-0.051320236,0.01969138,-0.001147422,-0.057013184,-0.008385133,0.0556479,-0.0330155,-0.070961975,-0.010659587,-0.024792437,0.001221811,0.018144399,0.054582946,0.0629025,0.035505902,-0.003146937,-0.02765939,0.048624672,-0.035810232,-0.09621213,0.046358433,0.020302206,0.003197107,-0.005732629,-0.036999047,-0.05253206,0.029699283,0.036282506,0.03818099,-0.00024645915,0.027267896,0.019410865,-0.043132763,-0.03451179,-0.04877367,0.022092313,0.001729218,-0.03658551,-0.021275075,0.03112768,0.025395598,-0.0022776653,0.0014127406,-0.049370486,-0.076526724,0.03048346,0.061707277,-0.052832823,-0.009360549,0.09698572,0.031243322,-0.017829167,0.00996321,0.0120087145,-0.012966212,-0.008259127,0.37247124,-0.068252526,0.004483522,0.046338707,-0.021378385,-0.029892292,-0.0045614475,-0.008710193,-0.097206175,-0.0137373675,0.049406096,-0.010430672,-0.039357476,-0.006882908,-0.056400526,-0.03606077,-0.013872307,0.05286437,0.00065616757,-0.0048200167,0.009733095,0.012484451,0.0020397275,0.003650991,0.04534244,-0.009199618,-0.06289805,0.010646929,0.11053804,0.04356398,0.056065816,0.045117956,0.038513646,-0.092500366,0.00086546404,0.017862272,-0.00092510815,0.0036994438,0.0071306983,0.03547925,0.009264815,-0.03103319,-0.052254606,0.007827081,-0.00817308,-0.003944388,0.094455756,-0.042233255,0.02583302,-0.017073404,-0.0035536354,-0.008380745,0.07803927,1.6189822e-05,-0.0690013,-0.0066182744,-0.014216141,0.027931107,0.008585887,0.02843959,-0.048511844,-0.067439064,0.049349558,0.014460739,0.07720651,-0.062400877,-0.06838149,-0.0053422046,-0.020028803,0.005141274,-0.035501234,0.0047266777,0.05697333,-0.06676833,-0.0055076308,0.06752239,0.0077382475,-0.060538474,-0.01662626,0.0056340788,0.02056991,0.0054334747,-0.013917437,-0.056685373,0.0089017935,0.04654885,-0.01756945,-0.019551989,-0.05412063,-0.009870688,0.017253384,-0.047740646,0.028004553,-0.031138055,-0.037345853,-0.0851202,-0.031003822,0.04356046,-0.03453924,0.023243029,0.013539229,0.07605596,0.03190329,-0.009178587,0.037068993,-0.040505547,0.0056655854,0.02539819,-0.052648894,0.004548411,0.027683472,-0.07921694,-0.044786226,-0.013592887,0.037216987,-0.03972171,-0.03197329,0.0064076837,0.046620604,0.007995421,-0.02529797,-0.06501259,-0.056427166,-0.029213272,-0.27102172,0.0057979785,0.046694636,-0.041094728,-0.04814579,-0.006404869,0.000788078,0.02580614,-0.04216584,0.041090377,-0.0007918054,-0.0911036,-0.0009502648,-0.019778462,-0.05557245,0.02696773,-0.016357439,-0.03263521,-0.044566978,0.022397302,-0.014408429,-0.0013491695,0.045623958,-0.046845354,-0.02157305,-0.080585234,0.19026133,0.027216954,0.045789495,0.08660852,0.06711191,0.0030985342,0.009203799,-0.08973994,0.03526791,0.018407105,-0.060125116,0.04605819,0.01272002,-0.01161427,0.0071794316,0.04446071,0.023142036,-0.02027418,0.040432584,-0.023537377,0.015037986,-0.031549744,-0.005839236,0.04753956,-0.03263133,-0.017927047,0.038280766,0.029577356,0.019901741,-0.029784665,0.0017886396,-0.028840592,0.008661644,0.08197425,0.025722804,-0.01672059,-0.037619747,-0.018021567,0.041270506,0.003944543,0.011778718,-0.071422115,-0.0056135166,-0.04158126,-0.03601897,0.0791907,0.04886052,-4.3756223e-05,0.016424688,0.058340553,0.017934373,0.025385637,0.030105628,0.016573854,-0.0017931229,-0.008128477,-0.0036652829,0.06253881,0.062363006,-0.013134246,0.059364203,-0.0008104747,-0.012629765,-0.022630539,-0.00053453416,-0.01395162,0.04037205,-0.015969146,0.042606313,-0.04044761,-0.28681797,0.020103147,0.09332038,0.048850223,0.051785592,0.071357936,0.012800526,-0.075454764,-0.0075916955,-0.015053473,0.016352065,0.0483883,0.07849342,0.0029945492,-0.00035652818,0.050109193,0.071891434,-0.032480158,0.040857248,-0.00387888,0.027406272,0.069475934,0.17520405,-0.025335787,0.049322598,-0.0023952245,-0.004154655,-0.0053908583,0.008514138,0.0054244148,-0.051491678,0.013916455,0.10113065,0.0059997197,0.0041204207,0.019828873,0.010226581,-0.011496001,0.034861308,-0.036123786,-0.0017236291,-0.031475194,-0.04606283,0.0077261524,0.050306093,0.0257916,0.0012058889,-0.046696957,0.0037693698,-0.03647139,-0.05531651,-0.05487893,-0.024546191,0.016223049,0.051636994,-0.024830144,-0.034577712,0.0422727,-0.0552802,0.010778012,0.04491665,0.012241778,0.02267415,0.050002564,0.0121696135]	{"insights": [{"type": "opportunity", "title": "Potential for Increased Sales", "description": "The Licensee has the opportunity to increase sales by meeting the production volume commitments and maintaining high-quality products."}, {"type": "alert", "title": "Risk of Non-Compliance", "description": "The Licensee must be aware of the risk of non-compliance with manufacturing requirements and late payment charges, and take steps to mitigate these risks."}]}	2025-10-15 18:30:00.292656
81a656ee-39ae-48fc-b85c-6c6b8f360f1c	500477ab-8c84-4e1e-8fbe-221cb5d67149	summary	This is a Plant Variety License & Royalty Agreement between Green Innovation Genetics LLC (Licensor) and Heritage Gardens Nursery & Landscaping (Licensee). The agreement grants exclusive regional plant variety rights to the Licensee for a period of 8 years with automatic renewal for successive 4-year periods. The Licensee must pay royalties based on Net Plant Sales, with varying rates depending on the type of plant and sales volume.	[-0.0548753,-0.050576936,0.021734761,-0.053965613,0.03257127,0.035969414,-0.02095315,-0.021990558,-0.037653353,0.09903114,-0.045690354,0.011420982,0.0391769,-2.0451778e-05,-0.046017043,-0.0020291079,0.008036468,-0.004794163,-0.0317792,-0.008054262,0.026549876,-0.005330694,-0.0352686,-0.008270079,-0.055786353,-0.0025163654,-0.06880176,0.0064534983,-0.034700297,-0.16130641,-0.016113413,0.042370077,-0.018539911,-0.0033375146,-0.008106003,-0.016370893,-0.056271397,-0.011205082,0.0029634836,0.02148762,0.0824159,-0.014805523,-0.033268284,0.02594154,-0.038742762,0.007074128,-0.0029444234,0.019500913,-0.010345228,-0.0061579267,0.030336518,-0.032758422,-0.0006963199,0.052553564,-0.04981605,0.06294583,0.091221444,0.0580958,-0.016008902,0.023244824,0.012661932,0.022245646,-0.21690318,0.02876272,-0.038375933,0.0054566474,-0.048520546,-0.065341935,0.00030869545,-0.031125942,0.052409314,0.031341687,-0.046949316,-0.024883557,0.03941104,0.07625006,-0.023063915,-0.018527022,-0.024549048,-0.03389242,-0.026257874,-0.028595302,-0.01623167,-0.059142932,-0.021640427,0.0064229523,-0.047813896,0.027953869,0.07749794,0.08365862,0.051991552,-0.060343333,0.01325111,-0.032538436,-0.07861405,0.009267787,0.034853466,-0.02908334,0.008761453,0.34614667,-0.025668278,0.030809153,-0.038630966,0.010212269,-0.012643689,-0.0040389495,-0.08160994,-0.0018979924,-0.0113513265,0.0007177697,0.0077594835,0.02446053,0.092216454,0.008307739,-0.059386276,0.023982242,-0.04062963,0.048484724,0.050550845,-0.0004108835,-0.00876148,0.036272325,0.00621595,0.044989545,-0.042665165,0.0398357,-0.0006980366,0.041918334,0.046339653,0.077594005,0.03652419,0.06197501,-0.0144459205,-0.015521218,-0.015681425,-0.0001168837,-0.009088753,0.008812768,0.027988575,0.019083377,-0.0020714696,-0.030402225,-0.009530337,-0.02156034,0.0007089859,0.033812836,-0.0030270466,0.07070898,-0.026220381,0.08176545,-0.027151147,0.062731296,0.00059664034,-0.012828148,0.024387732,0.0971522,0.072883,-0.0045938333,0.018589746,-0.0054965,0.013391646,0.05254444,0.020815888,0.08691858,-0.0011090139,-0.13003182,0.019384302,-0.024926983,0.026718415,0.027702218,0.005155467,0.03943824,0.07525733,-0.025658427,0.027876396,-0.042116635,-0.057230957,0.025294902,0.047512475,0.010638154,0.023528412,-0.007106836,-0.0126617765,-0.0004522893,0.011488714,-0.010933017,-0.022206213,0.021582875,-0.035909116,0.03545085,-0.007368456,-0.026864141,-0.03426258,0.08489254,0.015564608,-0.065082066,-0.08027979,0.028178968,0.12267776,-0.023925217,-0.052940056,0.0370715,0.039115,-0.022712616,-0.023575772,0.007264352,0.049713388,0.014544349,0.054855898,0.017627778,-0.05742904,0.04578192,-0.00078215,0.012376303,-0.04453727,0.07926464,-0.017754465,0.026010793,0.078333065,0.08680385,-0.005579197,-0.00890006,0.0043701497,-0.29695585,-0.034648307,-0.056593783,0.033561967,0.03384706,0.010871914,-0.05502199,-0.025180621,-0.048655372,-0.01057843,0.059827365,0.010329532,0.012364947,0.016446784,-0.000921874,-0.019896777,0.10524016,0.015347904,-0.0076513886,-0.0351506,0.01346201,-0.0389126,0.05234881,-0.038287345,0.06937489,-0.019852199,0.09957857,-0.06993738,-0.014228267,-0.021632263,0.014439823,0.0008393711,-0.038249552,-0.044757087,0.02716378,0.017211434,-0.043126233,0.007941351,-0.017883198,-0.011878553,0.0071485923,0.012013475,-0.05757157,-0.04984968,0.0016880054,0.004209578,-0.021906244,0.070531696,0.06740745,0.004784258,-0.00458254,0.013517313,0.042463306,0.056821764,0.011080897,-0.034729302,-0.0603382,0.078928195,-0.01191148,0.008981798,0.06010017,-0.038265638,0.074571095,-0.060928542,0.03374245,-0.086984046,-0.0058402196,-0.0024124773,0.020963583,-0.038175058,0.030080551,-0.009348454,-0.0070925667,-0.057917845,-0.006421819,0.04808269,-0.0212114,-0.051656984,0.00026022704,0.0135168675,-0.024470245,-0.05502195,0.01783165,0.07006423,-0.060670096,0.021854434,-0.017097523,-0.0049389894,0.017368047,-0.03229171,0.016576685,0.04768622,-0.028711399,-0.010080306,0.01009602,-0.020171842,-0.28809056,0.027618496,-0.028537387,0.039347,-0.0076510436,0.02727803,-0.0024996207,0.013136031,-0.032566704,-0.059435464,0.04357194,0.0045627416,-0.0020163995,-0.014965739,0.017076485,0.007994512,0.09520133,-0.01505532,-0.013490548,-0.061374765,0.06452043,0.017587774,0.106480174,0.035138976,-0.012743655,-0.0361491,-0.041202456,0.032877736,0.015318764,-0.067636445,-0.05039259,0.025103852,0.0711624,-0.08244067,0.03943801,0.05352138,-0.051006,-0.02017447,-0.04161384,-0.0042011766,-0.049739733,-0.05960715,-0.06585032,0.0049386304,-0.004192943,-0.052541364,0.011938529,-0.022417964,-0.062279064,0.02460101,0.051940225,-0.01657732,-0.03523156,0.011470658,-0.025157558,-0.026456963,0.035474595,0.009683088,0.01933833,-0.042090043,0.020228352,-0.046531826,-0.03207698,0.11459049,0.0076413113]	{"type": "summary"}	2025-10-15 18:29:59.20819
8c52e21f-73cb-4ea3-834d-f2d0be8cccc6	500477ab-8c84-4e1e-8fbe-221cb5d67149	key_terms	[object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object]	[-0.029917,0.010987811,-0.02382003,-0.061188996,0.014624095,-0.00058916677,0.02532213,-0.03843175,0.051462095,0.04100082,-0.02875065,-0.08338046,0.0062819785,-0.0055786488,0.032632545,-0.048051354,0.009598552,0.0607168,-0.08215711,-0.05672461,0.066856034,-0.017484061,-0.048984837,-0.03942319,-0.022723785,0.09761533,0.018220022,-0.0051568085,-0.036149222,-0.16640866,-0.04658365,-0.008414659,-0.01492506,0.028178914,0.020346968,0.017105382,-0.035115868,0.05646424,-0.07629423,0.026530989,0.055580504,-0.004666739,-0.036581688,-0.0601175,-0.0022288181,-0.017897947,-0.04863786,-0.017862258,0.036157183,-0.046498027,-0.07740227,-0.041764606,-0.0421569,0.05305529,0.024652982,0.04214629,0.044218145,0.047905833,-0.017685281,-0.008308193,0.0505556,-0.0018819355,-0.08148973,0.022040136,0.016469738,0.031764984,-0.008076806,-0.026056342,-0.011696514,0.04961493,0.04212531,0.04081058,0.02747504,0.020835932,0.019829746,-0.019216105,-0.035634708,-0.06912418,0.014050619,-0.005806741,-0.036622413,-0.007986283,0.0075921896,0.046868786,-0.008352877,-0.009519124,-0.056342445,-0.0947896,0.014106495,0.06868067,-0.05078709,0.019788243,0.063183434,0.025454415,-0.03410491,-0.017067818,-0.00083573716,-0.05074973,0.021976175,0.36882514,-0.08194472,-0.006157381,0.07370184,-0.031687148,-0.026119256,-0.017343072,-0.012132663,-0.094902985,0.012440363,0.058262404,-0.017435743,-0.064908475,0.032550503,-0.06601702,-0.066719815,-0.046608135,0.05213939,-0.027362848,0.0076824357,-0.008298543,0.010604633,0.011917416,0.035709344,0.024043353,-0.018812606,-0.076978445,0.008864149,0.12597567,0.05827304,0.0754369,0.010102635,0.1021886,-0.061479077,0.002718549,0.008881441,0.021520868,0.0024104689,-0.03197842,0.034504894,0.020508997,-0.04121871,-0.05047906,-0.00807553,-0.03137091,-0.0062890686,0.105400056,-0.046594813,0.02973203,-0.0041234526,0.043172043,0.016922014,0.08997135,0.031346284,-0.040496394,0.00083216955,-0.013534927,0.028431801,-0.0008303692,0.00354938,-0.015719716,-0.08906025,0.01792753,0.02062306,0.13254446,-0.06596746,-0.07543938,0.043838974,-0.020601619,0.0014131707,-0.024242332,-0.013187898,0.061149757,-0.06353913,0.024059206,0.057530444,0.023279943,-0.040468007,-0.012804531,0.0031173355,0.019944595,-0.021030255,-0.001217073,-0.049850058,0.037015066,0.047967643,0.030948201,-0.018281046,-0.033155266,-0.014171544,0.018736083,-0.010153218,0.014036103,-0.053305708,-0.03412274,-0.06789396,-0.048959758,0.026725058,-0.04774828,0.0016826252,-0.0068552285,0.09180729,0.005655985,-0.020669403,0.02557489,-0.011076421,-0.00779846,-0.006079689,-0.031833097,0.045965705,0.0087792175,-0.059230663,-0.023151014,0.014961968,0.02183771,-0.010505906,-0.015970264,0.02258985,0.041594192,-0.0041340888,-0.012155353,-0.056780607,-0.041355416,-0.04913164,-0.24758087,0.019636212,0.058624946,-0.038971152,-0.06776015,-0.0037790139,0.011993083,0.030474426,-0.011886876,0.017604174,-0.008837065,-0.068903185,-0.011050413,0.0017934546,-0.023384595,0.008665375,-0.029449405,-0.018833434,-0.07081523,0.028711826,-0.024277039,0.012482956,0.0362485,-0.036630627,-0.04800316,-0.03283225,0.19355382,0.014289806,0.012972047,0.07425716,0.05833281,0.032264616,0.006739806,-0.024912693,0.060430847,0.036074467,-0.017221687,0.029400352,0.021030555,-0.023370672,0.009454852,0.04467961,0.038449388,-0.04353083,0.03691935,-0.041428585,-0.0036865894,-0.028973734,0.007270557,0.020169685,-0.029109472,-0.039439872,0.056238964,0.00372726,-0.013324681,-0.009786537,-0.0021447516,-0.01766433,-0.020357685,0.09155146,0.02829088,-0.05236269,-0.06139067,0.033471867,0.02526662,-0.028719349,0.025219405,-0.020040449,-0.040859398,-0.04670629,-0.060033523,0.047520418,0.037746597,-0.018171983,0.010867564,0.04676861,0.016740808,0.04092023,0.024474747,0.0024983236,0.028467566,0.024904255,-0.023889054,0.02616694,0.061572235,-0.0048373193,0.038990993,-0.0021647958,0.009257482,-0.006774457,0.022792764,-0.015462018,0.021065056,0.007857894,0.081017725,-0.000396665,-0.3074742,0.02028618,0.07037545,0.048929438,0.065452665,0.048192967,0.011144737,-0.09278719,0.008617589,-0.017847499,0.009542779,0.03640893,0.07306826,-0.039358966,-0.0046897447,0.032846235,0.059392586,-0.050422687,0.045846954,-0.019936793,0.0059435028,0.049781397,0.18020721,-0.04633807,0.053447887,0.008819065,0.0063078096,-0.000364295,-0.00084595906,0.026460083,-0.043970186,-0.01062144,0.096798204,0.029828934,0.020925142,0.057587072,-0.00014328126,-0.018985523,0.011619387,-0.034529526,-0.011662715,-0.013330407,-0.037152883,-0.0015337664,0.00731611,0.03171014,-0.008791078,-0.05598366,-0.0035483136,-0.030346386,-0.05272621,-0.050662883,-0.025806747,-0.0027387817,0.03995339,-0.02852235,0.0018139189,0.048113838,-0.05879055,0.010792592,0.026156757,-0.016638683,0.0059629534,0.03564547,-0.008262379]	{"terms": [{"type": "Royalty Structure", "location": "Section 3.1", "confidence": 0.95, "description": "The Licensee must pay royalties based on Net Plant Sales, with varying rates depending on the type of plant and sales volume. For example, for Tier 1 - Ornamental Trees & Shrubs, the royalty rate is $1.25 per unit for 1-gallon containers, with a discount rate of $1.10 per unit for 5,000+ units annually."}, {"type": "Payment Terms", "location": "Section 6.2", "confidence": 0.9, "description": "The Licensee must pay royalties within 45 days of the quarter end, with a late payment charge of 1.25% per month. The Licensee must also pay an annual certification and inspection fee of $12,500."}, {"type": "Manufacturing Requirements", "location": "Section 5.2", "confidence": 0.88, "description": "The Licensee must meet certain production standards, including genetic purity of 99.8% minimum, plant health of 95% survival rate, and size specifications that meet or exceed published standards for each container size."}, {"type": "Licensed Technology & Patents", "location": "Section 1.2", "confidence": 0.85, "description": "The Licensor grants the Licensee access to proprietary propagation methods covered by US Patent 11,456,892 and US Patent 11,234,567, as well as trade secret 'GreenGrow™ Nutrient Formula and Application Methods'."}, {"type": "Termination & Post-Termination", "location": "Section 9.1", "confidence": 0.8, "description": "Either party may terminate the agreement upon 180 days written notice for material breach, or upon 12 months notice for convenience. Upon termination, the Licensee may sell existing finished inventory for 18 months subject to continued royalty payments."}, {"type": "Financial Obligations", "location": "Section 4.1", "confidence": 0.85, "description": "The Licensee must pay an initial license fee of $125,000, as well as an annual certification and inspection fee of $12,500. The Licensee must also guarantee minimum annual royalty payments totaling $85,000."}, {"type": "Performance Requirements", "location": "Section 5.1", "confidence": 0.8, "description": "The Licensee must meet certain production volume commitments, including a minimum of 15,000 total plants across all varieties in Years 1-2, and a minimum of 50,000 total plants or market saturation targets in Years 5+."}, {"type": "Territory & Scope", "location": "Section 2.1", "confidence": 0.85, "description": "The agreement grants exclusive production and distribution rights to the Licensee within the Primary Territory of Oregon, Washington, Northern California, and Idaho, with non-exclusive rights in the Secondary Territory of Montana, Wyoming, Utah, and Nevada."}]}	2025-10-15 18:29:59.355338
\.


--
-- Data for Name: contract_obligations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contract_obligations (id, contract_id, obligation_type, description, due_date, responsible, status, priority, completion_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contract_royalty_calculations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contract_royalty_calculations (id, contract_id, name, period_start, period_end, status, total_sales_amount, total_royalty, currency, sales_count, breakdown, chart_data, calculated_by, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, comments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contracts (id, file_name, original_name, file_size, file_type, file_path, contract_type, priority, status, uploaded_by, notes, processing_started_at, processing_completed_at, created_at, updated_at) FROM stdin;
500477ab-8c84-4e1e-8fbe-221cb5d67149	7fd57fa2-26ba-43be-9954-9664e3cf7e56.pdf	Plant Variety License & Royalty Agreement.pdf	443464	application/pdf	/home/runner/workspace/uploads/7fd57fa2-26ba-43be-9954-9664e3cf7e56.pdf	\N	normal	analyzed	993f41bb-59e7-4a3a-ad0d-25e808ca81c7	\N	\N	2025-10-15 18:30:00.318	2025-10-15 18:29:37.940564	2025-10-15 18:30:00.318
\.


--
-- Data for Name: financial_analysis; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.financial_analysis (id, contract_id, total_value, currency, payment_schedule, royalty_structure, revenue_projections, cost_impact, currency_risk, payment_terms, penalty_clauses, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: market_benchmarks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.market_benchmarks (id, contract_type, industry, benchmark_data, average_value, standard_terms, risk_factors, last_updated, created_at) FROM stdin;
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.performance_metrics (id, contract_id, performance_score, milestone_completion, on_time_delivery, budget_variance, quality_score, client_satisfaction, renewal_probability, last_review_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: royalty_rules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.royalty_rules (id, contract_id, rule_type, rule_name, description, product_categories, territories, container_sizes, seasonal_adjustments, territory_premiums, volume_tiers, base_rate, minimum_guarantee, calculation_formula, priority, is_active, confidence, source_section, source_text, created_at, updated_at, formula_definition, formula_version) FROM stdin;
4add6fb0-0fed-4006-9168-33b068661ed4	500477ab-8c84-4e1e-8fbe-221cb5d67149	formula_based	Aurora Flame Maple - 1-gallon with volume tiers	1-gallon containers: 1.25% royalty, 1.10% for 5000+ units with seasonal adjustments	{"Ornamental Trees"}	{Primary,Secondary}	{1-gallon}	\N	\N	\N	\N	\N	\N	1	t	0.95	Section 3.1 - Royalty Structure - Tier 1	1-gallon containers: 1.25% royalty, 1.10% for 5000+ units with seasonal adjustments	2025-10-15 18:29:42.030708	2025-10-15 18:29:42.030708	{"name": "Aurora Flame Maple Royalty", "filters": {"containerSize": "1-gallon"}, "formula": {"type": "multiply", "operands": [{"type": "reference", "field": "grossAmount"}, {"type": "tier", "tiers": [{"max": 4999, "min": 0, "rate": 1.25, "label": "< 5000 units"}, {"max": null, "min": 5000, "rate": 1.1, "label": "5000+ units"}], "reference": {"type": "reference", "field": "units"}}, {"type": "lookup", "table": {"Fall": 0.95, "Spring": 1.1, "Summer": 1, "Holiday": 1.2}, "default": 1, "reference": {"type": "reference", "field": "season"}, "description": "Seasonal adjustment"}]}, "description": "Volume-tiered percentage with seasonal adjustment"}	1.0
41c2b941-9a16-4bc6-a258-759f330a2313	500477ab-8c84-4e1e-8fbe-221cb5d67149	formula_based	Pacific Sunset Rose - 4-inch pots with multiplier chain	4-inch pots: 0.75 base rate, 1.0x multiplier, seasonal adjustments	{"Perennials & Roses"}	{Primary,Secondary}	{"4-inch pots"}	\N	\N	\N	\N	\N	\N	1	t	0.95	Section 3.1 - Royalty Structure - Tier 2	4-inch pots: 0.75 base rate, 1.0x multiplier, seasonal adjustments	2025-10-15 18:29:42.059526	2025-10-15 18:29:42.059526	{"name": "Pacific Sunset Rose Royalty", "filters": {"containerSize": "4-inch pots"}, "formula": {"type": "multiply", "operands": [{"type": "reference", "field": "grossAmount"}, {"type": "literal", "value": 0.75}, {"type": "lookup", "table": {"Fall": 0.95, "Spring": 1.15, "Summer": 1, "Holiday": 1.2}, "default": 1, "reference": {"type": "reference", "field": "season"}, "description": "Seasonal adjustment"}, {"type": "lookup", "table": {"Primary": 1, "Secondary": 1.1}, "default": 1, "reference": {"type": "reference", "field": "territory"}, "description": "Territory premium"}]}, "description": "Multiplier chain with seasonal adjustment"}	1.0
810b0bac-e279-432c-b874-826fafdb88e1	500477ab-8c84-4e1e-8fbe-221cb5d67149	formula_based	Cascade Blue Hydrangea - 1-2500 units with tiered rates	1-2500 units: $2.25 per unit, 2501-7500 units: $1.95 per unit, 7501+ units: $1.70 per unit	{"Flowering Shrubs"}	{Primary,Secondary}	{}	\N	\N	\N	\N	\N	\N	1	t	0.95	Section 3.1 - Royalty Structure - Tier 3	1-2500 units: $2.25 per unit, 2501-7500 units: $1.95 per unit, 7501+ units: $1.70 per unit	2025-10-15 18:29:42.082162	2025-10-15 18:29:42.082162	{"name": "Cascade Blue Hydrangea Royalty", "filters": {"salesVolume": "1-2500 units"}, "formula": {"type": "multiply", "operands": [{"type": "reference", "field": "grossAmount"}, {"type": "tier", "tiers": [{"max": 2500, "min": 0, "rate": 2.25, "label": "< 2500 units"}, {"max": 7500, "min": 2501, "rate": 1.95, "label": "2501-7500 units"}, {"max": null, "min": 7501, "rate": 1.7, "label": "7501+ units"}], "reference": {"type": "reference", "field": "units"}}]}, "description": "Tiered rates with no seasonal adjustments"}	1.0
163b462e-14dc-4878-a08d-552d44f899cf	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Tier 1 — Ornamental Trees & Shrubs	Plant Size CategoryRoyalty per UnitVolume Discount ThresholdDiscounted Rate\n1-gallon containers$1.255,000+ units annually$1.10\n3-gallon containers$2.852,000+ units annually$2.50\n5-gallon containers$4.501,000+ units annually$3.95\n15-gallon+ specimens$12.75200+ units annually$11.25	{"Ornamental Trees",Shrubs}	{"Primary Territory"}	{}	{}	{}	[{"max": 4999, "min": 0, "rate": 1.25}, {"min": 5000, "rate": 1.1}]	\N	\N	\N	1	t	0.90	3.1 Plant Royalty Rates	Tier 1 - Ornamental Trees & Shrubs (Aurora Flame Maple, Golden Spire Juniper):	2025-10-15 18:29:54.926082	2025-10-15 18:29:54.926082	\N	1.0
e254ecb9-4166-4405-be88-f494bcb897b3	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Tier 2 — Perennials & Roses	Container SizeBase Royalty\nRate\nPremium Variety\nMultiplier\nSeasonal\nAdjustment\n4-inch pots$0.751.0x (standard)+15% spring season\n6-inch pots$1.151.2x (premium roses)+10% spring season\n1-gallon containers$1.851.3x (specimen grade)Standard rate\n2-gallon+\ncontainers\n$3.251.5x (mature plants)-5% fall clearance	{Perennials,Roses}	{"Primary Territory"}	{}	{}	{}	[{"max": 4999, "min": 0, "rate": 1.75}, {"min": 5000, "rate": 1.1}]	\N	\N	\N	2	t	0.90	3.1 Plant Royalty Rates	Tier 2 - Perennials & Roses (Pacific Sunset Rose, Emerald Crown Hosta):	2025-10-15 18:29:54.948314	2025-10-15 18:29:54.948314	\N	1.0
8b981fd8-42a4-4d32-aff0-8e96a5e01313	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Tier 3 — Flowering Shrubs	Sales Volume (Annual)Royalty RateMinimum Annual Payment\n1 - 2,500 units$2.25 per unit$8,500\n2,501 - 7,500 units$1.95 per unit$12,000\n7,501 - 15,000 units$1.70 per unit$18,500\n15,001+ units$1.45 per unit$25,000	{"Flowering Shrubs"}	{"Primary Territory"}	{}	{}	{}	[{"max": 2500, "min": 0, "rate": 2.25}, {"max": 7500, "min": 2501, "rate": 1.95}, {"max": 15000, "min": 7501, "rate": 1.7}, {"min": 15001, "rate": 1.45}]	\N	\N	\N	3	t	0.90	3.1 Plant Royalty Rates	Tier 3 - Flowering Shrubs (Cascade Blue Hydrangea):	2025-10-15 18:29:54.97029	2025-10-15 18:29:54.97029	\N	1.0
0f73e9b9-c01c-4f9d-aac1-23278ea4775f	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Spring Seasonal Premium	seasonal adjustment for spring sales	{}	{}	{}	{}	{}	[]	15.00	\N	\N	3	t	0.85	3.2 Seasonal Royalty Adjustments	Spring Season (March-May): +10-15% premium for peak demand varieties	2025-10-15 18:29:54.995044	2025-10-15 18:29:54.995044	\N	1.0
f679fcee-9723-4e73-9207-00b8a31040d0	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Fall Seasonal Discount	seasonal discount for fall sales	{}	{}	{}	{}	{}	[]	-5.00	\N	\N	3	t	0.85	3.2 Seasonal Royalty Adjustments	Fall Season (September-November): -5% discount for clearance sales	2025-10-15 18:29:55.01664	2025-10-15 18:29:55.01664	\N	1.0
1bb3ff66-9b79-480e-84d5-75f1b1c6e2a4	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Holiday Seasonal Premium	seasonal adjustment for holiday sales	{}	{}	{}	{}	{}	[]	20.00	\N	\N	3	t	0.85	3.2 Seasonal Royalty Adjustments	Holiday Seasons: +20% premium for gift-appropriate varieties during December	2025-10-15 18:29:55.038749	2025-10-15 18:29:55.038749	\N	1.0
49f324a4-738c-41d6-86a6-bc45a4294fd2	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Organic Premium	premium for organic sales	{}	{}	{}	{}	{}	[]	25.00	\N	\N	1	t	0.85	8.3 Organic Certification	Organic premium royalty of +25% applies to certified organic sales	2025-10-15 18:29:55.060752	2025-10-15 18:29:55.060752	\N	1.0
94344561-05c1-46e4-afc1-8d6a44456409	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Premium Variety Multiplier	multiplier for premium varieties	{}	{}	{}	{}	{}	[]	1.20	\N	\N	2	t	0.85	3.1 Plant Royalty Rates	Premium Variety Multiplier	2025-10-15 18:29:55.085991	2025-10-15 18:29:55.085991	\N	1.0
cf84a053-4bf3-4c32-b40e-b0cba504b966	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Specimen Grade Multiplier	multiplier for specimen grade varieties	{}	{}	{}	{}	{}	[]	1.30	\N	\N	2	t	0.85	3.1 Plant Royalty Rates	Specimen Grade Multiplier	2025-10-15 18:29:55.109879	2025-10-15 18:29:55.109879	\N	1.0
afbdf7e6-47f9-4470-a742-3a371867a6d1	500477ab-8c84-4e1e-8fbe-221cb5d67149	tiered_pricing	Mature Plant Multiplier	multiplier for mature plants	{}	{}	{}	{}	{}	[]	1.50	\N	\N	2	t	0.85	3.1 Plant Royalty Rates	Mature Plant Multiplier	2025-10-15 18:29:55.131781	2025-10-15 18:29:55.131781	\N	1.0
\.


--
-- Data for Name: sales_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_data (id, matched_contract_id, match_confidence, transaction_date, transaction_id, product_code, product_name, category, territory, currency, gross_amount, net_amount, quantity, unit_price, custom_fields, import_job_id, created_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
uPrgOTc9O9l8WxzVzhai7OSSRoIfIneE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-09T21:43:00.123Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-16 21:42:33
VHIOhK08pl1bAc0chhZXpuIxkVBkDOVC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-16T18:47:56.131Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-16 18:47:57
AI0XVWLm6eDPGklb8r-WpjHO3Zm25vtQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-16T18:48:02.467Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-16 18:51:10
HXCMXJMLR3pfl-yls5Q65sTo5AZVei60	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-16T18:57:20.634Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-16 19:01:01
p7VqHWixAqMoLW6pr7tZJZFNyUddLe4J	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-12T23:23:42.016Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-18 19:35:33
Jt28cvQqmwR8bY6FEUpgNKlwA1mlYh_F	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-16T19:01:41.345Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-16 19:03:28
uhb4rTTxEa6fwTVbGUFkY1IG4AllafNL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-16T19:03:57.535Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-16 19:04:01
FxAEfPZ_3N6cY2K1YS3Lc8_vRWBgDAG0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-10-17T18:52:09.364Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"993f41bb-59e7-4a3a-ad0d-25e808ca81c7"}}	2025-10-22 20:53:51
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
-clxiaWRzZbuaIKB8ylIs0xX7wMH64LY	{"cookie": {"path": "/", "secure": true, "expires": "2025-09-12T14:00:20.409Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-09-12 14:10:25
\.


--
-- Data for Name: strategic_analysis; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.strategic_analysis (id, contract_id, strategic_value, market_alignment, competitive_advantage, risk_concentration, standardization_score, negotiation_insights, benchmark_comparison, recommendations, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, is_active, created_at, updated_at, username, password) FROM stdin;
993f41bb-59e7-4a3a-ad0d-25e808ca81c7	admin@licenceiq.com	System	Administrator	\N	admin	t	2025-09-05 14:21:19.795215	2025-09-05 14:21:19.795215	admin	ba8f14f711d9fc4778ed45c6828a2e847b0a17474e9456fc1156a07d0180c33d85bd21c9929ad37fecedf62eabb63b78209b8aeeae58c89aa66518be284c2966.c284ef4d946e44e4ed060ef6ba260cc5
8430b90f-51ce-4b83-bcef-cfdebfb0aa35	owner@licenceiq.com	Company	Owner	\N	owner	t	2025-09-05 14:21:21.218866	2025-09-05 14:21:21.218866	owner	b1de5549189f1c63520d5675aa2e28819259ae8368ab1e9abe5b0017b0234c5b8ff39e90e810aa7301cfe5518a939bd796273f628fea13abb42ba0474556c4bf.6610e82753cc28eabf487397eab7a0e7
e8d057be-f50c-4097-ad01-34c6878ad68b	editor@licenceiq.com	Content	Editor	\N	editor	t	2025-09-05 14:21:22.560947	2025-09-05 14:21:22.560947	editor	63bf70e25094c038028b0913f3d6abc1f016c8d934e7d5f6ed2a6eceb9005d93f9c12c7c648c699e82f98cabb073cf01c3a23ade8949056a2891a7b85e772fb1.cd218db3174ffe9349d1d095f5e96401
86ed9fd5-69bc-4751-a26b-0c7e79813e0f	viewer@licenceiq.com	Basic	Viewer	\N	viewer	t	2025-09-05 14:21:24.083283	2025-09-05 14:21:24.083283	viewer	7eb76e32d678866e16a1b36fee3e7f384b7f31bdf7ca5b3a9bd3505e5003919428d6596fd54c9990f3c938823b04215466c0ff9005c61ca53263106b642ffe9d.755a166f8b4b4df16f7aea8c3962341a
fe4ad658-4662-4417-a204-74d4af654eee	auditor@licenceiq.com	Compliance	Auditor	\N	admin	t	2025-09-05 14:21:25.694389	2025-09-05 15:19:25.732	auditor	ecadbb8955473d020ac6b8d47aa27171b39c3e2dc36a1b2987c9bc5da5e9b8038058ed75730d93d4bf7f6bb0ba7d5dbe4258d458e2d5267f59d0ffc072ca2c45.cc25703da5827206a688a516e3fbb1bd
buG0AJVN5-	testuser_buG0AJVN5-@example.com	Test	User	\N	admin	t	2025-09-11 14:10:09.618592	2025-09-11 14:10:09.618592	testuser_buG0AJVN5-	testpassword123
47214137	kmlnrao@yahoo.com	Narasimha	K	\N	editor	t	2025-09-05 13:58:42.723944	2025-09-11 18:32:47.925	\N	temp
829a0f0c-8ecb-4294-95f8-0b8f129f9d50	testadmin@example.com	Test	Admin	\N	admin	t	2025-09-11 20:00:29.404387	2025-09-11 20:13:14.023	testadmin	fec29586e35b1d15c7134ba89890246e2789806237615e8379c7d93ad4743bcb6f1207db8324a9159bd92ef8f341172f919cfb3075a042c646cb3665f0f95297.a3917eb582bcd42464f58e5dabab3f68
52532e6a-8614-429c-a281-1293a7ff4db9	testuser123@example.com	Test	User	\N	admin	t	2025-09-11 20:23:02.311767	2025-09-11 20:23:02.311767	testuser123	aa5331da35c2956714240bf9f0419c3497f21557d3e13c416f16b5dd171acb1d233c4cf525edb1a6e18f00b9863dc6a3da7a9b2f36f5e04353883251b8ac36af.fb9c981afc21abafe0bff16e616028f6
27405ef9-a742-4fa2-b37c-ff9d197571ff	testuser@example.com	Test	User	\N	admin	t	2025-09-15 18:28:37.102315	2025-09-15 18:28:37.102315	testuser	f27d4c91b3f9a7b0d8e2a1c5e7f3b9d2c4e6a8b0f2d4c6e8a0b2d4f6c8e0a2b4d6c8.abcdef123456
80552359-92b2-4956-8a1b-deb479622ab1	playwright_test@example.com	Playwright	Test	\N	admin	t	2025-09-15 18:29:08.12009	2025-09-15 18:29:08.12009	playwright_test	e4a6422690ff8520b6b10565591e400519019cf16d7fa76ed157136019054c7d70913b80cf86816dbba7a32921b3df3bd1f822e72cfbdf58c9a27389c9188556.c0837dd5a2f7e85aed87fe1bfdac7e42
b343f532-edb9-4a39-a38f-805bae49f380	localadmin@example.com	Local	Admin	\N	admin	t	2025-09-16 00:14:29.727579	2025-09-16 00:14:29.727579	localadmin	401f316d84560c1dd60d664ef026eada084969edf3236b86a9f6f2c37be7e9f51028b7af95513737c00685e25e9db747573b257e6caf7a5772d5ec405716df10.ac098ba0c90476f1b8ae144c4fbcd408
cd7e3584-911f-40e6-bbd9-f9996fe58336	admin_new@example.com	Admin	User	\N	admin	t	2025-09-16 00:15:05.899051	2025-09-16 00:15:05.899051	admin_new	6dc99e21de49a08c2332a70f99258fae1984c27bce40bec5b720f934ec9c6d72e4dfc8a8e5a13048eb8ed59ef89dd641823ab2f6f43c937bb94c6a26cc2270b5.ce1b60e7d8bcd6cf261de4759de4740f
19eaeefb-9bd0-4548-9c37-1a5f84af8d3d	john@testvendor.com	John	Smith	\N	viewer	t	2025-09-21 22:19:47.441986	2025-09-21 22:19:47.441986	testvendor_user	24f61de9c3e438d814ffa0271b9513923d109213aa937d0a3173dff5fd8670acd2a570a691aec551b8ce03e76b72b1d1cb6ef61bcc6eb506c5933d0a4d885c98.290b300b8fe533eff57d2f7523ba00ba
deafebd3-22fb-4d7b-9426-f019c3203bce	testvendor123@example.com	Test	Vendor	\N	viewer	t	2025-09-21 22:24:24.287155	2025-10-14 22:31:00.847	testvendor123	554a3e1bffb9efebf80f46c6cccb32423e20fc5c04850c2d234499271855e0c812208945da9f64e5368934db12201ce1af592ecbe1f4967894bd6162b1e51663.2384caaa482ca5bab14b3ce5aadfaef2
\.


--
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (id);


--
-- Name: compliance_analysis compliance_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.compliance_analysis
    ADD CONSTRAINT compliance_analysis_pkey PRIMARY KEY (id);


--
-- Name: contract_analysis contract_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_analysis
    ADD CONSTRAINT contract_analysis_pkey PRIMARY KEY (id);


--
-- Name: contract_comparisons contract_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_comparisons
    ADD CONSTRAINT contract_comparisons_pkey PRIMARY KEY (id);


--
-- Name: contract_embeddings contract_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_embeddings
    ADD CONSTRAINT contract_embeddings_pkey PRIMARY KEY (id);


--
-- Name: contract_obligations contract_obligations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_obligations
    ADD CONSTRAINT contract_obligations_pkey PRIMARY KEY (id);


--
-- Name: contract_royalty_calculations contract_royalty_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_royalty_calculations
    ADD CONSTRAINT contract_royalty_calculations_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: financial_analysis financial_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_analysis
    ADD CONSTRAINT financial_analysis_pkey PRIMARY KEY (id);


--
-- Name: market_benchmarks market_benchmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.market_benchmarks
    ADD CONSTRAINT market_benchmarks_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: royalty_rules royalty_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_rules
    ADD CONSTRAINT royalty_rules_pkey PRIMARY KEY (id);


--
-- Name: sales_data sales_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: strategic_analysis strategic_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.strategic_analysis
    ADD CONSTRAINT strategic_analysis_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: contract_embeddings_contract_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX contract_embeddings_contract_idx ON public.contract_embeddings USING btree (contract_id);


--
-- Name: contract_embeddings_embedding_hnsw_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX contract_embeddings_embedding_hnsw_idx ON public.contract_embeddings USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: contract_embeddings_type_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX contract_embeddings_type_idx ON public.contract_embeddings USING btree (embedding_type);


--
-- Name: audit_trail audit_trail_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: compliance_analysis compliance_analysis_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.compliance_analysis
    ADD CONSTRAINT compliance_analysis_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_analysis contract_analysis_contract_id_contracts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_analysis
    ADD CONSTRAINT contract_analysis_contract_id_contracts_id_fk FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_comparisons contract_comparisons_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_comparisons
    ADD CONSTRAINT contract_comparisons_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_embeddings contract_embeddings_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_embeddings
    ADD CONSTRAINT contract_embeddings_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_obligations contract_obligations_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_obligations
    ADD CONSTRAINT contract_obligations_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_royalty_calculations contract_royalty_calculations_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_royalty_calculations
    ADD CONSTRAINT contract_royalty_calculations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: contract_royalty_calculations contract_royalty_calculations_calculated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_royalty_calculations
    ADD CONSTRAINT contract_royalty_calculations_calculated_by_fkey FOREIGN KEY (calculated_by) REFERENCES public.users(id);


--
-- Name: contract_royalty_calculations contract_royalty_calculations_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_royalty_calculations
    ADD CONSTRAINT contract_royalty_calculations_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_royalty_calculations contract_royalty_calculations_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_royalty_calculations
    ADD CONSTRAINT contract_royalty_calculations_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: contracts contracts_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: financial_analysis financial_analysis_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_analysis
    ADD CONSTRAINT financial_analysis_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: performance_metrics performance_metrics_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: royalty_rules royalty_rules_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_rules
    ADD CONSTRAINT royalty_rules_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: sales_data sales_data_matched_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_matched_contract_id_fkey FOREIGN KEY (matched_contract_id) REFERENCES public.contracts(id);


--
-- Name: strategic_analysis strategic_analysis_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.strategic_analysis
    ADD CONSTRAINT strategic_analysis_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

