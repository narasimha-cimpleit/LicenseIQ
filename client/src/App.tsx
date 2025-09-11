import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
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
          <ProtectedRoute path="/contracts/:id" component={() => <ContractAnalysis />} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
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
