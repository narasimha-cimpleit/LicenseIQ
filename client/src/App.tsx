import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
import { FloatingAIAssistant } from "@/components/floating-ai-assistant";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Contracts from "@/pages/contracts";
import Upload from "@/pages/upload";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import CreateUser from "@/pages/create-user";
import Audit from "@/pages/audit";
import ContractAnalysis from "@/pages/contract-analysis";
import NotFound from "@/pages/not-found";
import RoyaltyDashboard from "@/pages/royalty-dashboard";
import SalesUpload from "@/pages/sales-upload";
import RulesManagement from "@/pages/rules-management";
import ContractQnA from "@/pages/contract-qna";
import RAGDashboard from "@/pages/rag-dashboard";
import HumanReviewQueue from "@/pages/HumanReviewQueue";
import AdminLeads from "@/pages/admin-leads";
import CalculationsPage from "@/pages/calculations";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Loading or unauthenticated users see landing page */}
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            {/* Protected routes for authenticated users */}
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/contracts" component={Contracts} />
            <ProtectedRoute path="/upload" component={Upload} />
            <ProtectedRoute path="/analytics" component={Analytics} />
            <ProtectedRoute path="/reports" component={Reports} />
            <ProtectedRoute path="/users" component={Users} />
            <ProtectedRoute path="/users/new" component={CreateUser} />
            <ProtectedRoute path="/audit" component={Audit} />
            {/* Royalty Calculations */}
            <ProtectedRoute path="/sales-upload" component={SalesUpload} />
            <ProtectedRoute path="/calculations" component={CalculationsPage} />
            <ProtectedRoute path="/royalty-dashboard/:id" component={RoyaltyDashboard} />
            <ProtectedRoute path="/contracts/:id/rules" component={RulesManagement} />
            {/* Contract Q&A */}
            <ProtectedRoute path="/contract-qna" component={ContractQnA} />
            <ProtectedRoute path="/rag-dashboard" component={RAGDashboard} />
            {/* Dynamic Extraction */}
            <ProtectedRoute path="/review-queue" component={HumanReviewQueue} />
            {/* Admin */}
            <ProtectedRoute path="/admin/leads" component={AdminLeads} />
            <ProtectedRoute path="/contracts/:id" component={ContractAnalysis} />
          </>
        )}
        
        <Route component={NotFound} />
      </Switch>
      
      {/* Floating AI Assistant - Omnipresent across all authenticated pages */}
      {isAuthenticated && !isLoading && <FloatingAIAssistant />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
