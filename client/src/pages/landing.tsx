import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Brain, Shield, BarChart3 } from "lucide-react";

export default function Landing() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <FileText className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">LicenceIQ</h1>
          </div>
          
          <h2 className="text-5xl font-bold tracking-tight text-foreground">
            AI-Powered Contract Intelligence
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your contract management with advanced AI analysis, risk assessment, 
            and intelligent insights using cutting-edge LLaMA models.
          </p>
          
          <div className="flex gap-4 justify-center pt-8">
            <Link href="/auth">
              <Button size="lg" className="px-8" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <p className="text-muted-foreground">
                Extract key terms, clauses, and insights automatically using advanced language models
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Risk Assessment</h3>
              <p className="text-muted-foreground">
                Identify potential legal risks and compliance issues before they become problems
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Document Management</h3>
              <p className="text-muted-foreground">
                Organize and track all your contracts with powerful search and categorization
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Analytics & Reporting</h3>
              <p className="text-muted-foreground">
                Comprehensive insights and audit trails for compliance and decision making
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
