import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Mail, Phone, MapPin, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactName: z.string().min(1, "Contact name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  licenseCount: z.number().default(0),
  description: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactEmail: "",
      contactName: "",
      phone: "",
      address: "",
      description: "",
      licenseCount: 0,
    },
  });

  // Fetch vendors
  const { data: vendorsData, isLoading } = useQuery<{ vendors: any[] }>({
    queryKey: ["/api/vendors", searchQuery],
  });

  const vendors = vendorsData?.vendors || [];

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: VendorFormData) => {
    createVendorMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Vendors</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendors and their license agreements for royalty calculations
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-vendor" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Vendor</DialogTitle>
              <DialogDescription>
                Add a new vendor to manage their license documents and royalty calculations.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    data-testid="input-vendor-name"
                    placeholder="Acme Technologies"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    data-testid="input-contact-name"
                    placeholder="John Smith"
                    {...form.register("contactName")}
                  />
                  {form.formState.errors.contactName && (
                    <p className="text-sm text-red-500">{form.formState.errors.contactName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    data-testid="input-contact-email"
                    placeholder="john@acmetech.com"
                    {...form.register("contactEmail")}
                  />
                  {form.formState.errors.contactEmail && (
                    <p className="text-sm text-red-500">{form.formState.errors.contactEmail.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    placeholder="+1 (555) 123-4567"
                    {...form.register("phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  data-testid="input-address"
                  placeholder="123 Business Ave, City, State 12345"
                  {...form.register("address")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="textarea-description"
                  placeholder="Brief description of the vendor..."
                  className="min-h-[80px]"
                  {...form.register("description")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createVendorMutation.isPending}
                  data-testid="button-save-vendor"
                >
                  {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-vendors"
          className="w-full"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor: any) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow" data-testid={`card-vendor-${vendor.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg" data-testid={`text-vendor-name-${vendor.id}`}>
                      {vendor.name}
                    </CardTitle>
                    <CardDescription data-testid={`text-contact-name-${vendor.id}`}>
                      {vendor.contactName}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" data-testid={`badge-license-count-${vendor.id}`}>
                  {vendor.licenses?.length || 0} licenses
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span data-testid={`text-email-${vendor.id}`}>{vendor.contactEmail}</span>
              </div>
              
              {vendor.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span data-testid={`text-phone-${vendor.id}`}>{vendor.phone}</span>
                </div>
              )}
              
              {vendor.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span data-testid={`text-address-${vendor.id}`}>{vendor.address}</span>
                </div>
              )}

              {vendor.licenses && vendor.licenses.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    <span>Recent Licenses:</span>
                  </div>
                  <div className="space-y-1">
                    {vendor.licenses.slice(0, 2).map((license: any) => (
                      <div key={license.id} className="text-xs text-muted-foreground truncate" data-testid={`text-license-${license.id}`}>
                        • {license.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {license.status}
                        </Badge>
                      </div>
                    ))}
                    {vendor.licenses.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{vendor.licenses.length - 2} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-vendor-${vendor.id}`}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {vendors.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No vendors match your search criteria."
              : "Start by adding your first vendor to manage license agreements."
            }
          </p>
          {!searchQuery && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-first-vendor">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Vendor
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}