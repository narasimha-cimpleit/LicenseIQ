import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Contracts from "@/pages/contracts";
import Upload from "@/pages/upload";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import Audit from "@/pages/audit";
import ContractAnalysis from "@/pages/contract-analysis";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/contracts" component={Contracts} />
          <Route path="/upload" component={Upload} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/reports" component={Reports} />
          <Route path="/users" component={Users} />
          <Route path="/audit" component={Audit} />
          <Route path="/contracts/:id" component={ContractAnalysis} />
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
