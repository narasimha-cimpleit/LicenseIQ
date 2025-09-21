import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  File, 
  BarChart3, 
  Upload, 
  TrendingUp, 
  FileText, 
  Users, 
  History,
  LogOut
} from "lucide-react";
import cimpleitLogo from "@assets/image_1757086402738.png";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      current: location === "/",
    },
    {
      name: "Contracts",
      href: "/contracts",
      icon: File,
      current: location === "/contracts" || location.startsWith("/contracts/"),
    },
    {
      name: "Upload",
      href: "/upload",
      icon: Upload,
      current: location === "/upload",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: TrendingUp,
      current: location === "/analytics",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileText,
      current: location === "/reports",
    },
  ];

  // Add admin-only navigation items
  if (user?.role === 'admin' || user?.role === 'owner') {
    navigation.push({
      name: "User Management",
      href: "/users",
      icon: Users,
      current: location === "/users",
    });
  }

  // Add audit trail for authorized users
  if (user?.role === 'admin' || user?.role === 'owner' || user?.role === 'auditor') {
    navigation.push({
      name: "Audit Trail",
      href: "/audit",
      icon: History,
      current: location === "/audit",
    });
  }

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <aside className={cn("fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border sidebar-transition", className)}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-sidebar-border">
          <img src={cimpleitLogo} alt="Cimpleit Logo" className="w-8 h-8 mr-3" />
          <h1 className="text-xl font-semibold text-sidebar-foreground">LicenseIQ</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  item.current && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => setLocation(item.href)}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="mr-3 h-4 w-4 text-blue-400" />
                {item.name}
              </Button>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-secondary-foreground">
                {userInitials}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email
                }
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {user?.role || 'User'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sidebar-foreground hover:text-sidebar-foreground"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
