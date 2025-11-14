import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/sidebar-context";
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
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from "lucide-react";
import logoSymbol from "@assets/Original Logo Symbol_1762113838183.png";

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
  const { user } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebar();

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
        "fixed inset-y-0 left-0 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 border-r border-blue-900/50 shadow-2xl sidebar-transition z-50 transform transition-all duration-300 ease-in-out",
        "md:translate-x-0",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
      <div className="flex flex-col h-full">
        {/* Logo & Toggle */}
        <div className="flex flex-col items-center px-4 py-2 border-b border-white/10 gap-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 flex justify-center">
                <div className="bg-slate-900 rounded-2xl p-3 shadow-xl">
                  <img src={logoSymbol} alt="LicenseIQ" className="h-24 w-24 transition-opacity duration-300" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="flex-shrink-0 text-white hover:bg-white/10 transition-all duration-300"
                data-testid="button-toggle-sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="text-white hover:bg-white/10 transition-all duration-300"
              data-testid="button-toggle-sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full text-white hover:bg-white/10 transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "justify-start",
                  item.current && "bg-white/20 shadow-md"
                )}
                onClick={() => handleNavClick(item.href)}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 text-white transition-all duration-200",
                  !isCollapsed && "mr-3"
                )} />
                {!isCollapsed && (
                  <span className="transition-opacity duration-200 font-medium">{item.name}</span>
                )}
              </Button>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className={cn(
            "flex items-center transition-all duration-200",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="h-10 w-10 bg-gradient-to-br from-white to-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-sm font-bold text-blue-700">
                {userInitials}
              </span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 transition-opacity duration-200">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email
                  }
                </p>
                <p className="text-xs text-white/70 capitalize">
                  {user?.role || 'User'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
