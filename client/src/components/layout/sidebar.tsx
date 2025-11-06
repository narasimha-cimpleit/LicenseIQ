import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { 
  File, 
  BarChart3, 
  Upload, 
  TrendingUp, 
  FileText, 
  Users, 
  History,
  LogOut,
  Building2,
  Receipt,
  Calculator,
  Brain,
  Database,
  PlayCircle,
  Sparkles,
  ClipboardCheck,
  Mail,
  Layers,
  Table,
  LucideIcon
} from "lucide-react";
import licenseIQLogo from "@assets/Transparent Logo_1761867914841.png";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Icon mapping from database icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  'BarChart3': BarChart3,
  'File': File,
  'Upload': Upload,
  'Receipt': Receipt,
  'Calculator': Calculator,
  'Database': Database,
  'Layers': Layers,
  'Table': Table,
  'Brain': Brain,
  'Sparkles': Sparkles,
  'TrendingUp': TrendingUp,
  'FileText': FileText,
  'Mail': Mail,
  'ClipboardCheck': ClipboardCheck,
  'Users': Users,
  'History': History,
  'Building2': Building2,
};

export default function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fetch dynamic navigation permissions from database
  const { data: navData } = useQuery<{ items: any[] }>({
    queryKey: ['/api/navigation/allowed'],
    enabled: !!user,
  });

  // Build navigation from database permissions
  const navigation = (navData?.items || []).map((item: any) => {
    const Icon = item.iconName ? iconMap[item.iconName] || BarChart3 : BarChart3;
    return {
      name: item.itemName,
      href: item.href,
      icon: Icon,
      current: location === item.href || 
               (item.href !== "/" && location.startsWith(item.href)) ||
               (item.href === "/calculations" && location.startsWith("/royalty-dashboard/")),
    };
  });

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const handleNavClick = (href: string) => {
    setLocation(href);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border sidebar-transition z-50 transform transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center px-6 py-5 border-b border-sidebar-border bg-sidebar">
          <img src={licenseIQLogo} alt="LicenseIQ Logo" className="h-20" />
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
                onClick={() => handleNavClick(item.href)}
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
    </>
  );
}
