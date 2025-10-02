--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

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
-- Name: erp_connections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.erp_connections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    erp_type character varying NOT NULL,
    connection_config jsonb,
    mapping_config jsonb,
    is_active boolean DEFAULT true,
    last_sync_at timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_erp_type CHECK (((erp_type)::text = ANY ((ARRAY['csv'::character varying, 'sftp'::character varying, 'netsuite'::character varying, 'sap'::character varying, 'dynamics'::character varying, 'api'::character varying])::text[])))
);


ALTER TABLE public.erp_connections OWNER TO neondb_owner;

--
-- Name: erp_import_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.erp_import_jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    connection_id character varying,
    job_type character varying NOT NULL,
    file_name character varying,
    status character varying DEFAULT 'pending'::character varying,
    records_imported integer,
    records_failed integer,
    errors jsonb,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.erp_import_jobs OWNER TO neondb_owner;

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
-- Name: license_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.license_documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying NOT NULL,
    file_name character varying NOT NULL,
    original_name character varying NOT NULL,
    file_path character varying NOT NULL,
    file_size integer NOT NULL,
    license_type character varying,
    effective_date timestamp without time zone,
    expiration_date timestamp without time zone,
    status character varying DEFAULT 'uploaded'::character varying,
    uploaded_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.license_documents OWNER TO neondb_owner;

--
-- Name: license_rule_sets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.license_rule_sets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    license_document_id character varying,
    vendor_id character varying,
    version integer NOT NULL,
    name character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying,
    effective_date timestamp without time zone,
    expiration_date timestamp without time zone,
    rules_dsl jsonb NOT NULL,
    extraction_metadata jsonb,
    published_by character varying,
    published_at timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    contract_id character varying,
    CONSTRAINT check_ruleset_status CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.license_rule_sets OWNER TO neondb_owner;

--
-- Name: license_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.license_rules (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    rule_set_id character varying NOT NULL,
    rule_type character varying NOT NULL,
    rule_name character varying NOT NULL,
    conditions jsonb,
    calculation jsonb,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    source_span jsonb,
    confidence numeric(5,2),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_rule_type CHECK (((rule_type)::text = ANY ((ARRAY['percentage'::character varying, 'tiered'::character varying, 'minimum_guarantee'::character varying, 'cap'::character varying, 'deduction'::character varying])::text[])))
);


ALTER TABLE public.license_rules OWNER TO neondb_owner;

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
-- Name: product_mappings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_mappings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying,
    external_code character varying NOT NULL,
    internal_category character varying NOT NULL,
    description character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_mappings OWNER TO neondb_owner;

--
-- Name: royalty_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.royalty_results (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    run_id character varying NOT NULL,
    sales_data_id character varying,
    rule_id character varying,
    sales_amount numeric(15,2) NOT NULL,
    royalty_amount numeric(15,2) NOT NULL,
    royalty_rate numeric(8,4),
    calculation_details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.royalty_results OWNER TO neondb_owner;

--
-- Name: royalty_runs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.royalty_runs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    vendor_id character varying,
    rule_set_id character varying,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    total_sales_amount numeric(15,2),
    total_royalty numeric(15,2),
    records_processed integer,
    execution_log jsonb,
    run_by character varying,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.royalty_runs OWNER TO neondb_owner;

--
-- Name: sales_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying,
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
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_sales_currency_length CHECK ((char_length((currency)::text) = 3))
);


ALTER TABLE public.sales_data OWNER TO neondb_owner;

--
-- Name: sales_staging; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_staging (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    import_job_id character varying NOT NULL,
    external_id character varying,
    row_data jsonb NOT NULL,
    validation_status character varying DEFAULT 'pending'::character varying,
    validation_errors jsonb,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_staging OWNER TO neondb_owner;

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
-- Name: vendors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vendors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    contact_email character varying,
    contact_phone character varying,
    address text,
    tax_id character varying,
    currency character varying DEFAULT 'USD'::character varying,
    payment_terms character varying,
    notes text,
    is_active boolean DEFAULT true,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_currency_length CHECK ((char_length((currency)::text) = 3))
);


ALTER TABLE public.vendors OWNER TO neondb_owner;

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
-- Name: contract_obligations contract_obligations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_obligations
    ADD CONSTRAINT contract_obligations_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: erp_connections erp_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.erp_connections
    ADD CONSTRAINT erp_connections_pkey PRIMARY KEY (id);


--
-- Name: erp_import_jobs erp_import_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.erp_import_jobs
    ADD CONSTRAINT erp_import_jobs_pkey PRIMARY KEY (id);


--
-- Name: financial_analysis financial_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_analysis
    ADD CONSTRAINT financial_analysis_pkey PRIMARY KEY (id);


--
-- Name: license_documents license_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_documents
    ADD CONSTRAINT license_documents_pkey PRIMARY KEY (id);


--
-- Name: license_rule_sets license_rule_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT license_rule_sets_pkey PRIMARY KEY (id);


--
-- Name: license_rules license_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rules
    ADD CONSTRAINT license_rules_pkey PRIMARY KEY (id);


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
-- Name: product_mappings product_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT product_mappings_pkey PRIMARY KEY (id);


--
-- Name: royalty_results royalty_results_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_results
    ADD CONSTRAINT royalty_results_pkey PRIMARY KEY (id);


--
-- Name: royalty_runs royalty_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_runs
    ADD CONSTRAINT royalty_runs_pkey PRIMARY KEY (id);


--
-- Name: sales_data sales_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_pkey PRIMARY KEY (id);


--
-- Name: sales_staging sales_staging_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_staging
    ADD CONSTRAINT sales_staging_pkey PRIMARY KEY (id);


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
-- Name: royalty_results unique_calculation_result; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_results
    ADD CONSTRAINT unique_calculation_result UNIQUE (run_id, sales_data_id, rule_id);


--
-- Name: license_rule_sets unique_license_version; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT unique_license_version UNIQUE (license_document_id, version);


--
-- Name: product_mappings unique_vendor_external_code; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT unique_vendor_external_code UNIQUE (vendor_id, external_code);


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
-- Name: vendors vendors_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_code_key UNIQUE (code);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_royalty_results_run_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_royalty_results_run_id ON public.royalty_results USING btree (run_id);


--
-- Name: idx_royalty_results_sales_data_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_royalty_results_sales_data_id ON public.royalty_results USING btree (sales_data_id);


--
-- Name: idx_royalty_runs_period; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_royalty_runs_period ON public.royalty_runs USING btree (period_start, period_end);


--
-- Name: idx_royalty_runs_vendor_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_royalty_runs_vendor_id ON public.royalty_runs USING btree (vendor_id);


--
-- Name: idx_ruleset_dsl; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ruleset_dsl ON public.license_rule_sets USING gin (rules_dsl);


--
-- Name: idx_sales_data_custom_fields; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_data_custom_fields ON public.sales_data USING gin (custom_fields);


--
-- Name: idx_sales_data_import_job; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_data_import_job ON public.sales_data USING btree (import_job_id);


--
-- Name: idx_sales_data_product_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_data_product_code ON public.sales_data USING btree (product_code);


--
-- Name: idx_sales_data_transaction_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_data_transaction_date ON public.sales_data USING btree (transaction_date);


--
-- Name: idx_sales_data_vendor_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_data_vendor_date ON public.sales_data USING btree (vendor_id, transaction_date);


--
-- Name: idx_sales_data_vendor_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_data_vendor_id ON public.sales_data USING btree (vendor_id);


--
-- Name: idx_sales_staging_import_job; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_staging_import_job ON public.sales_staging USING btree (import_job_id);


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
-- Name: contract_obligations contract_obligations_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_obligations
    ADD CONSTRAINT contract_obligations_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contracts contracts_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: erp_connections erp_connections_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.erp_connections
    ADD CONSTRAINT erp_connections_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: erp_import_jobs erp_import_jobs_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.erp_import_jobs
    ADD CONSTRAINT erp_import_jobs_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.erp_connections(id);


--
-- Name: erp_import_jobs erp_import_jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.erp_import_jobs
    ADD CONSTRAINT erp_import_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: financial_analysis financial_analysis_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_analysis
    ADD CONSTRAINT financial_analysis_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: sales_data fk_sales_data_import_job; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT fk_sales_data_import_job FOREIGN KEY (import_job_id) REFERENCES public.erp_import_jobs(id);


--
-- Name: sales_staging fk_sales_staging_import_job; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_staging
    ADD CONSTRAINT fk_sales_staging_import_job FOREIGN KEY (import_job_id) REFERENCES public.erp_import_jobs(id);


--
-- Name: license_documents license_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_documents
    ADD CONSTRAINT license_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: license_documents license_documents_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_documents
    ADD CONSTRAINT license_documents_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: license_rule_sets license_rule_sets_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT license_rule_sets_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: license_rule_sets license_rule_sets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT license_rule_sets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: license_rule_sets license_rule_sets_license_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT license_rule_sets_license_document_id_fkey FOREIGN KEY (license_document_id) REFERENCES public.license_documents(id);


--
-- Name: license_rule_sets license_rule_sets_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT license_rule_sets_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- Name: license_rule_sets license_rule_sets_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rule_sets
    ADD CONSTRAINT license_rule_sets_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: license_rules license_rules_rule_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_rules
    ADD CONSTRAINT license_rules_rule_set_id_fkey FOREIGN KEY (rule_set_id) REFERENCES public.license_rule_sets(id);


--
-- Name: performance_metrics performance_metrics_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: product_mappings product_mappings_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT product_mappings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: royalty_results royalty_results_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_results
    ADD CONSTRAINT royalty_results_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.license_rules(id);


--
-- Name: royalty_results royalty_results_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_results
    ADD CONSTRAINT royalty_results_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.royalty_runs(id);


--
-- Name: royalty_results royalty_results_sales_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_results
    ADD CONSTRAINT royalty_results_sales_data_id_fkey FOREIGN KEY (sales_data_id) REFERENCES public.sales_data(id);


--
-- Name: royalty_runs royalty_runs_rule_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_runs
    ADD CONSTRAINT royalty_runs_rule_set_id_fkey FOREIGN KEY (rule_set_id) REFERENCES public.license_rule_sets(id);


--
-- Name: royalty_runs royalty_runs_run_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_runs
    ADD CONSTRAINT royalty_runs_run_by_fkey FOREIGN KEY (run_by) REFERENCES public.users(id);


--
-- Name: royalty_runs royalty_runs_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.royalty_runs
    ADD CONSTRAINT royalty_runs_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: sales_data sales_data_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: strategic_analysis strategic_analysis_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.strategic_analysis
    ADD CONSTRAINT strategic_analysis_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: vendors vendors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

