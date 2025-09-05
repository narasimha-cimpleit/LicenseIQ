import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleNewContract = () => {
    setLocation("/upload");
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
          </Button>
          <Button onClick={handleNewContract} data-testid="button-header-new-contract">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>
    </header>
  );
}
