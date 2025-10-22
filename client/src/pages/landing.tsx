import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, Shield, FileText, BarChart3, 
  CheckCircle, ArrowRight, Sparkles, 
  Clock, TrendingUp, Zap, Globe,
  FileCheck, Search, Calculator
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
              The{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI-powered ERP
              </span>
              <br />
              for contract management
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto animate-in fade-in slide-in-from-top-8 duration-700 delay-200">
              Transform your contract management with advanced AI analysis, risk assessment, 
              and intelligent insights using cutting-edge LLaMA models.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-top-10 duration-700 delay-300">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="px-8 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300"
                  data-testid="button-get-started"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 h-14 text-lg border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 animate-in fade-in duration-700 delay-400">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Powered by industry-leading AI</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Groq LLaMA</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold">Hugging Face</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Enterprise Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              The all-in-one{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                contract suite
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Drive financial excellence with customized AI automations at every step
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 - AI Analysis */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    AI Analysis
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Extract key terms, clauses, and insights automatically using advanced language models
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 - Risk Assessment */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 dark:hover:border-green-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Risk Assessment
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Identify potential legal risks and compliance issues before they become problems
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 - Document Management */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Document Management
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Organize and track all your contracts with powerful search and categorization
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 - Analytics & Reporting */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200 dark:hover:border-indigo-800">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Analytics & Reporting
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Comprehensive insights and audit trails for compliance and decision making
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Meet your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                contract intelligence
              </span>
              {" "}ally
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Achieve more in less time. Cut out manual work and refocus on the data you need to scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Capability 1 */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">OCR Reading</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Upload any document and AI will automatically extract and categorize contract terms
                  </p>
                </div>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Semantic Search</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    AI-powered RAG system answers questions about your contracts with source citations
                  </p>
                </div>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Royalty Calculator</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Automated royalty calculations with volume tiers and seasonal adjustments
                  </p>
                </div>
              </div>
            </div>

            {/* Capability 4 */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Risk Detection</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    AI spots compliance issues and potential risks before they impact your business
                  </p>
                </div>
              </div>
            </div>

            {/* Capability 5 */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Real-time Updates</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Continuous monitoring and instant notifications for contract changes
                  </p>
                </div>
              </div>
            </div>

            {/* Capability 6 */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Smart Analytics</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Generate insights and track KPIs with AI-powered data visualization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                    Achieve more in{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      less time
                    </span>
                  </h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300">
                    Cut out manual work and refocus on strategic analysis that drives growth
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">95% Time Savings</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Turn 10-40 hours of manual work into just 30 minutes per quarter
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Eliminate Errors</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Prevent $10K-$100K+ payment disputes with automated accuracy
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Audit-Ready Reports</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        Generate professional documentation and compliance reports instantly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Quick Implementation</h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        4-week setup vs 18-month enterprise solutions with immediate ROI
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
                      <TrendingUp className="h-8 w-8" />
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
                      <Globe className="h-8 w-8" />
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

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to transform your contract management?
            </h2>
            <p className="text-xl text-blue-100">
              Join industry leaders using AI to streamline licensing and royalty calculations
            </p>
            <Link href="/auth">
              <Button 
                size="lg" 
                variant="secondary"
                className="px-10 h-14 text-lg bg-white text-blue-600 hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300"
                data-testid="button-get-started-cta"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
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
