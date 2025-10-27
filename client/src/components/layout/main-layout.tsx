import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "./sidebar";
import Header from "./header";
import licenseIQLogo from "@assets/image_1761594259468.png";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function MainLayout({ children, title, description }: MainLayoutProps) {
  // Remove auth checks - ProtectedRoute already handles authentication
  // This prevents blank screens caused by double auth checking

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
                <img src={licenseIQLogo} alt="LicenseIQ Logo" className="h-7" />
              </div>
              <span>•</span>
              <p>&copy; 2025 LicenseIQ. All rights reserved.</p>
            </div>
            <p>Agentic AI for Financial Contracts</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
