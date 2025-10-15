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

