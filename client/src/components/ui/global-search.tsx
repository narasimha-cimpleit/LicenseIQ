import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, FileText, Upload, Receipt, Calculator, Database, Layers, Table, Building2, Brain, Sparkles, TrendingUp, Users, History, Settings, Mail, ClipboardCheck, BarChart3, File, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredItems = navigationItems
    .filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(query) ||
        item.itemKey.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder); // Preserve original sortOrder

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
    <>
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search for any page or feature..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading navigation...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center p-8 text-sm text-destructive">
              Failed to load navigation items
            </div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigation">
                {filteredItems.map((item) => {
                  const Icon = getIcon(item.iconName);
                  return (
                    <CommandItem
                      key={item.itemKey}
                      value={item.itemName}
                      onSelect={() => handleSelect(item.href)}
                      className="cursor-pointer"
                      data-testid={`search-result-${item.itemKey}`}
                    >
                      <Icon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>{item.itemName}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.href}
                      </Badge>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
