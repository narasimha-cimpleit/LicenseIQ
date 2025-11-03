import { Button } from "@/components/ui/button";
import { Bell, Plus, Menu } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  description?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, description, onMenuClick }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleNewContract = () => {
    setLocation("/upload");
  };

  // Hide New Contract button on Analytics page since it's already in main dashboard
  const showNewContractButton = title !== "Enterprise Analytics";

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMenuClick}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground hidden sm:block">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
          </Button>
          {showNewContractButton && (
            <Button onClick={handleNewContract} data-testid="button-header-new-contract" size="sm" className="md:size-default">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">New Contract</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
