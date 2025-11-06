import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Plus, Menu, User, LogOut, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title: string;
  description?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, description, onMenuClick }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleNewContract = () => {
    setLocation("/upload");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSettings = () => {
    setLocation("/configuration");
  };

  // Hide New Contract button on Analytics page since it's already in main dashboard
  const showNewContractButton = title !== "Enterprise Analytics";

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

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
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative h-9 w-9 rounded-full"
                data-testid="button-user-profile"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {userInitials}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(user?.role === 'admin' || user?.role === 'owner') && (
                <DropdownMenuItem onClick={handleSettings} data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
