import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "./sidebar";
import Header from "./header";
import cimpleitLogo from "@assets/image_1757086402738.png";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function MainLayout({ children, title, description }: MainLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <Header title={title} description={description} />
        <div className="p-6 flex-1" data-testid="main-content">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="border-t bg-background/50 px-6 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img src={cimpleitLogo} alt="Cimpleit Logo" className="w-5 h-5" />
                <span className="font-semibold text-primary">CIMPLEIT</span>
              </div>
              <span>•</span>
              <p>Powered by <a href="https://cimpleit.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cimpleit</a></p>
              <span>•</span>
              <p>&copy; 2024 Cimpleit. All rights reserved.</p>
            </div>
            <p>Innovative AI and Data Analytics Solutions</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
