import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Shield, RefreshCw, Check, X, Settings, Users, Database } from "lucide-react";

type NavItem = {
  id: string;
  itemKey: string;
  itemName: string;
  href: string;
  iconName?: string;
  defaultRoles: string[];
  isActive: boolean;
  sortOrder: number;
};

type RolePermission = {
  id: string;
  role: string;
  navItemKey: string;
  isEnabled: boolean;
};

const AVAILABLE_ROLES = ['user', 'analyst', 'auditor', 'admin', 'owner'];

export default function Configuration() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string>('user');

  // Fetch navigation items
  const { data: navData, isLoading: navLoading } = useQuery<{ items: NavItem[] }>({
    queryKey: ['/api/config/navigation'],
  });

  // Fetch role permissions
  const { data: permData, isLoading: permLoading } = useQuery<{ permissions: RolePermission[] }>({
    queryKey: ['/api/config/navigation/roles'],
  });

  // Seed navigation items mutation
  const seedNavMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/config/navigation/seed', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/config/navigation'] });
      toast({
        title: "Success",
        description: "Navigation items initialized successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize navigation items",
        variant: "destructive",
      });
    },
  });

  // Seed sample data mutation
  const seedDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/licenseiq-sample-data/seed', {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Created ${data.created} sample records across all entities`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed sample data",
        variant: "destructive",
      });
    },
  });

  // Update role permission mutation
  const updatePermMutation = useMutation({
    mutationFn: async ({ role, navItemKey, isEnabled }: { role: string; navItemKey: string; isEnabled: boolean }) => {
      return await apiRequest('POST', '/api/config/navigation/roles', { role, navItemKey, isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/config/navigation/roles'] });
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permission",
        variant: "destructive",
      });
    },
  });

  const navItems = navData?.items || [];
  const permissions = permData?.permissions || [];

  const isRoleEnabled = (itemKey: string, role: string): boolean => {
    const perm = permissions.find(p => p.navItemKey === itemKey && p.role === role);
    if (perm) return perm.isEnabled;
    
    // Check default roles
    const item = navItems.find(i => i.itemKey === itemKey);
    return item?.defaultRoles?.includes(role) || false;
  };

  const handleTogglePermission = (itemKey: string, role: string, currentValue: boolean) => {
    updatePermMutation.mutate({ role, navItemKey: itemKey, isEnabled: !currentValue });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage system settings, navigation permissions, and sample data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <Tabs defaultValue="navigation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="navigation" data-testid="tab-navigation">
            <Shield className="h-4 w-4 mr-2" />
            Navigation Permissions
          </TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">
            <Database className="h-4 w-4 mr-2" />
            Sample Data
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* Navigation Permissions Tab */}
        <TabsContent value="navigation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role-Based Navigation Access
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Control which menu items are visible to each user role
                  </CardDescription>
                </div>
                <Button
                  onClick={() => seedNavMutation.mutate()}
                  disabled={seedNavMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  data-testid="button-init-nav"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${seedNavMutation.isPending ? 'animate-spin' : ''}`} />
                  {seedNavMutation.isPending ? 'Initializing...' : 'Initialize Navigation'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Role Selector */}
                <div className="flex gap-2 flex-wrap">
                  {AVAILABLE_ROLES.map(role => (
                    <Button
                      key={role}
                      variant={selectedRole === role ? "default" : "outline"}
                      onClick={() => setSelectedRole(role)}
                      className={selectedRole === role ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
                      data-testid={`button-role-${role}`}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Permissions Table */}
                {navLoading || permLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : navItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No navigation items found</p>
                    <p className="text-sm text-muted-foreground mt-2">Click "Initialize Navigation" to set up menu items</p>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Permissions for: <Badge variant="outline" className="ml-2">{selectedRole}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Menu Item</TableHead>
                              <TableHead>Route</TableHead>
                              <TableHead>Default Access</TableHead>
                              <TableHead className="text-center">Enabled</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {navItems.map(item => {
                              const isEnabled = isRoleEnabled(item.itemKey, selectedRole);
                              const hasDefault = item.defaultRoles?.includes(selectedRole);
                              
                              return (
                                <TableRow key={item.id} data-testid={`row-nav-${item.itemKey}`}>
                                  <TableCell className="font-medium">{item.itemName}</TableCell>
                                  <TableCell className="text-muted-foreground font-mono text-sm">{item.href}</TableCell>
                                  <TableCell>
                                    {hasDefault ? (
                                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                                        <Check className="h-3 w-3 mr-1" />
                                        Yes
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                                        <X className="h-3 w-3 mr-1" />
                                        No
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={() => handleTogglePermission(item.itemKey, selectedRole, isEnabled)}
                                      disabled={updatePermMutation.isPending}
                                      data-testid={`switch-${item.itemKey}-${selectedRole}`}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sample Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sample Data Management
              </CardTitle>
              <CardDescription className="mt-2">
                Seed sample records for testing and demonstration purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">LicenseIQ Entity Sample Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will create 3 sample records for key entities including Customers, Items, Sales Orders, and AR Invoices.
                  Perfect for testing Data Management CRUD operations.
                </p>
                <Button
                  onClick={() => seedDataMutation.mutate()}
                  disabled={seedDataMutation.isPending}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  data-testid="button-seed-sample-data"
                >
                  <Database className={`h-4 w-4 mr-2 ${seedDataMutation.isPending ? 'animate-pulse' : ''}`} />
                  {seedDataMutation.isPending ? 'Seeding...' : 'Seed Sample Data'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription className="mt-2">
                General system configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Additional system settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
