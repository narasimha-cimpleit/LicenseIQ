import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Shield, FileText, BarChart3, 
  CheckCircle, ArrowRight, Sparkles, 
  Clock, TrendingUp, Zap, Globe,
  FileCheck, Search, Calculator, Upload,
  Users, Lock, FileSpreadsheet, MessageSquare,
  DollarSign, Target, Building2, Settings,
  Layers, PieChart, Receipt, FileOutput,
  ChevronRight, Star, Award, Rocket
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LicenseIQ
              </span>
            </div>
            <Link href="/auth">
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                data-testid="button-login-nav"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">AI-Native Contract Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
              Reads contracts like a{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                lawyer
              </span>
              ,<br />
              calculates like an{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                accountant
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto animate-in fade-in slide-in-from-top-8 duration-700 delay-200">
              LicenseIQ transforms how manufacturing companies manage their licensing agreements and payment calculations. 
              Our AI agent eliminates manual errors, ensures audit compliance, and automates complex royalty calculations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-top-10 duration-700 delay-300">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="px-8 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300"
                  data-testid="button-get-started"
                >
                  Get Early Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 h-14 text-lg border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Watch Demo
              </Button>
            </div>

            {/* AI Feature Highlights */}
            <div className="pt-8 animate-in fade-in duration-700 delay-400">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">AI-powered features that drive results</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Intelligent Contract Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calculator className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold">Automated Calculations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Risk Detection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Complete{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                contract management
              </span>
              {" "}suite
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Everything you need to manage licensing agreements, from upload to payment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 - AI Contract Reading */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    AI Contract Reading
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Automatically extracts licensing terms, royalty rates, territories, and exclusions from any PDF contract
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 - Sales Matching */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 dark:hover:border-green-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    AI Sales Matching
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Upload sales data and AI automatically matches transactions to the correct contracts with confidence scoring
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 - Royalty Calculator */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Calculator className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Royalty Calculator
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Automated calculations with volume tiers, seasonal adjustments, minimums, and multi-party splits
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 - PDF Invoices */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200 dark:hover:border-indigo-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Receipt className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    PDF Invoices
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Generate professional, branded invoices with detailed breakdowns or summary reports instantly
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5 - Contract Q&A */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-200 dark:hover:border-pink-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Contract Q&A Chat
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Ask questions about your contracts in plain English. RAG-powered AI provides accurate answers with citations
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 6 - Rules Management */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-200 dark:hover:border-orange-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Settings className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Rules Management
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    View, edit, and create royalty calculation rules with full source attribution to contract clauses
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 7 - Risk Assessment */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-red-200 dark:hover:border-red-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Risk Assessment
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    AI identifies compliance issues, missing clauses, and potential legal risks before they become problems
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 8 - Analytics Dashboard */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-cyan-200 dark:hover:border-cyan-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Analytics Dashboard
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Financial, compliance, strategic, and performance insights with interactive charts and trend analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-600 text-white">Advanced Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise-grade{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                automation
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Cut out manual work and refocus on strategic analysis that drives growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Multi-Entity Support */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Multi-Entity Support</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Manage contracts across multiple entities with territory-based calculations and multi-currency support
                  </p>
                </div>
              </div>
            </div>

            {/* User Management & RBAC */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">User Management</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    5-tier role-based access control: Owner, Admin, Editor, Viewer, Auditor with granular permissions
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Complete Audit Trail</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    SOX-compliant activity logging tracks every action, calculation, and change for full accountability
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Numbering */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Smart Organization</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Auto-generated contract numbers (CNT-YYYY-NNN), version tracking, and amendment management
                  </p>
                </div>
              </div>
            </div>

            {/* Data Import/Export */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Flexible Data Import</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    CSV and Excel imports for sales data with automatic validation and cleansing
                  </p>
                </div>
              </div>
            </div>

            {/* ERP Integration Ready */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">ERP Integration Ready</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Built for integration with SAP, Oracle, NetSuite, QuickBooks, and custom systems via API
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
              <div className="space-y-8">
                <div>
                  <Badge className="mb-4 bg-green-600 text-white">Proven Results</Badge>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                    Achieve more in{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      less time
                    </span>
                  </h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300">
                    Eliminate manual errors that cost $10K-$100K+ in disputes and free your team for strategic work
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">95% Time Savings</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Manual calculations: 10-40 hours per quarter. With LicenseIQ: 30 minutes per quarter
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Eliminate Payment Errors</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Prevent underpayments and overpayments with automated accuracy and audit-ready documentation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Instant Compliance Reports</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Generate audit-ready reports with full calculation breakdowns and historical tracking
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Quick Implementation</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        4-week setup vs 18-month enterprise solutions. Start with CSV imports, scale to full automation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Immediate ROI</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Save $50K-$200K+ annually in labor costs and dispute resolution
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Stats Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-2xl shadow-2xl text-white">
                <h3 className="text-2xl font-bold mb-8">Enterprise Impact</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      <DollarSign className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">$200K+</div>
                      <div className="text-blue-100">Annual savings</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      <Clock className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">95%</div>
                      <div className="text-blue-100">Time reduction</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      <Zap className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">4 weeks</div>
                      <div className="text-blue-100">To full deployment</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      <Shield className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">100%</div>
                      <div className="text-blue-100">Audit compliance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                manufacturing
              </span>
              {" "}leaders
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Trusted by companies managing $50M+ revenue with complex licensing agreements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Consumer Products</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">Brand licensing and royalty management</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Automotive OEMs</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">Multi-tier supplier licensing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Electronics</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">High-volume patent licensing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Industrial Equipment</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">Machinery component licensing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-600 text-white">Flexible Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Choose your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                plan
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Start with contract intelligence, scale with enterprise features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Perfect for small to mid-size manufacturers</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">$2,000</span>
                  <span className="text-slate-600 dark:text-slate-300">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Up to 5 Contracts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">AI Contract Reading & Parsing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Basic Calculation Engine</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">CSV/Excel Import & Export</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Standard Reports</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Get Started</Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-blue-500 dark:border-blue-600 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Professional</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Full-featured platform for growing manufacturers</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">$5,000</span>
                  <span className="text-slate-600 dark:text-slate-300">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Up to 25 Contracts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">AI Contract Reading & Parsing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Semi-Automated Calculation Engine</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">CSV/Excel Import & Export</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Simple ERP Integrations (QBO, NetSuite)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Advanced Reports & Analytics</span>
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">Get Started</Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Custom solutions for large manufacturers</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Unlimited Contracts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Fully Automated Calculation Engine</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">ERP + Custom Integrations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Advanced AI Validations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Custom Reports & Dashboards</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">White-Glove Support</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Beta Program Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
              <Rocket className="h-5 w-5" />
              <span className="text-sm font-medium">Limited Beta Program - Q4 2025</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Be among the first to experience LicenseIQ
            </h2>
            <p className="text-xl text-blue-100">
              Join our exclusive beta program and help shape the future of contract intelligence
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
              <div className="flex items-start space-x-3">
                <Award className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Free Trial Period</h4>
                  <p className="text-sm text-blue-100">Extended trial with full feature access</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Early Bird Discount</h4>
                  <p className="text-sm text-blue-100">Exclusive pricing for beta participants</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Direct Design Input</h4>
                  <p className="text-sm text-blue-100">Shape features based on your needs</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Star className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Case Study Partnership</h4>
                  <p className="text-sm text-blue-100">Featured success story opportunity</p>
                </div>
              </div>
            </div>

            <Link href="/auth">
              <Button 
                size="lg" 
                variant="secondary"
                className="px-10 h-14 text-lg bg-white text-blue-600 hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300"
                data-testid="button-beta-access"
              >
                Get Early Access
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">LicenseIQ</span>
            </div>
            <div className="text-center md:text-right text-sm">
              <p>Powered by <span className="text-blue-400 font-semibold">CimpleIT Inc</span></p>
              <p className="text-slate-400">&copy; 2025 CimpleIT Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
