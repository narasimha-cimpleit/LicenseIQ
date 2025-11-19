import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, FileText, Upload, Receipt, Calculator, Database, Layers, Table, Building2, Brain, Sparkles, TrendingUp, Users, History, Settings, Mail, ClipboardCheck, BarChart3, File, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavigationItem {
  itemKey: string;
  itemName: string;
  href: string;
  iconName: string;
  sortOrder: number;
}

const iconMap: Record<string, any> = {
  BarChart3,
  File,
  Upload,
  Receipt,
  Calculator,
  Database,
  Layers,
  Table,
  Building2,
  Brain,
  Sparkles,
  TrendingUp,
  FileText,
  Mail,
  ClipboardCheck,
  Users,
  History,
  Settings,
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: navigationData, isLoading, isError } = useQuery<{ items: NavigationItem[] }>({
    queryKey: ['/api/navigation/allowed'],
  });

  const navigationItems = navigationData?.items || [];

  // Show error toast if navigation fetch fails
  useEffect(() => {
    if (isError) {
      toast({
        title: "Search Error",
        description: "Failed to load navigation items. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === "k" && (e.metaKey || e.ctrlKey) && !isTyping) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      // Close on Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const filteredItems = navigationItems
    .filter((item) => {
      if (!searchQuery) return true; // Show all if no search query
      const query = searchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(query) ||
        item.itemKey.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchQuery("");
    setLocation(href);
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Search;
    return Icon;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 md:h-10 md:w-64 md:justify-start md:px-3 md:py-2"
          onClick={() => setOpen(true)}
          data-testid="button-global-search"
        >
          <Search className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline-flex text-sm text-muted-foreground">
            Search...
          </span>
          <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[500px] p-0" 
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            placeholder="Search for any page or feature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            data-testid="input-global-search"
          />
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center p-8 text-sm text-destructive">
              Failed to load navigation
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredItems.map((item) => {
                const Icon = getIcon(item.iconName);
                return (
                  <button
                    key={item.itemKey}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left group"
                    data-testid={`search-result-${item.itemKey}`}
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/30">
                      <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.href}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
