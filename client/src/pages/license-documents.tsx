import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, Clock, CheckCircle, XCircle, Brain, Building2, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  vendorId: z.string().min(1, "Please select a vendor"),
  name: z.string().min(1, "Document name is required"),
  licenseType: z.string().default("general"),
  description: z.string().optional(),
  file: z.any().refine((files) => files?.length > 0, "Please select a file to upload"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const statusConfig = {
  uploaded: { color: "bg-blue-500", icon: Upload, label: "Uploaded" },
  processing: { color: "bg-yellow-500", icon: Clock, label: "Processing" },
  processed: { color: "bg-green-500", icon: Brain, label: "Rules Extracted" },
  failed: { color: "bg-red-500", icon: XCircle, label: "Failed" },
};

export default function LicenseDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      vendorId: "",
      name: "",
      licenseType: "general",
      description: "",
    },
  });

  // Fetch vendors for dropdown
  const { data: vendorsData } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const vendors = vendorsData?.vendors || [];

  // Fetch license documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["/api/license-documents", searchQuery],
  });

  const documents = documentsData?.documents || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (data: { formData: FormData }) => {
      return fetch("/api/license-documents", {
        method: "POST",
        body: data.formData,
        credentials: "include",
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Upload failed");
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "License document uploaded successfully. AI processing started.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/license-documents"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload license document",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: UploadFormData) => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", data.vendorId);
    formData.append("name", data.name);
    formData.append("licenseType", data.licenseType);
    if (data.description) {
      formData.append("description", data.description);
    }

    uploadMutation.mutate({ formData });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v: any) => v.id === vendorId);
    return vendor?.name || "Unknown Vendor";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">License Documents</h1>
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
          <h1 className="text-3xl font-bold">License Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload license documents for AI-powered royalty rule extraction
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-license" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload License
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload License Document</DialogTitle>
              <DialogDescription>
                Upload a PDF license document for AI-powered royalty rule extraction.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor *</Label>
                  <Select onValueChange={(value) => form.setValue("vendorId", value)}>
                    <SelectTrigger data-testid="select-vendor">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.vendorId && (
                    <p className="text-sm text-red-500">{form.formState.errors.vendorId.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="licenseType">License Type</Label>
                  <Select defaultValue="general" onValueChange={(value) => form.setValue("licenseType", value)}>
                    <SelectTrigger data-testid="select-license-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General License</SelectItem>
                      <SelectItem value="technology">Technology License</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing License</SelectItem>
                      <SelectItem value="distribution">Distribution License</SelectItem>
                      <SelectItem value="trademark">Trademark License</SelectItem>
                      <SelectItem value="patent">Patent License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  data-testid="input-document-name"
                  placeholder="Technology License Agreement - 2024"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="textarea-description"
                  placeholder="Brief description of the license agreement..."
                  className="min-h-[80px]"
                  {...form.register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">License Document (PDF) *</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  data-testid="input-file-upload"
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Upload a PDF file (max 100MB). The AI will extract royalty calculation rules automatically.
                </p>
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
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Process"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search license documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-documents"
          className="w-full"
        />
      </div>

      {/* Documents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc: any) => {
          const statusInfo = statusConfig[doc.status as keyof typeof statusConfig] || statusConfig.uploaded;
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow" data-testid={`card-document-${doc.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg line-clamp-1" data-testid={`text-document-name-${doc.id}`}>
                        {doc.name}
                      </CardTitle>
                      <CardDescription data-testid={`text-vendor-name-${doc.id}`}>
                        {getVendorName(doc.vendorId)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${statusInfo.color} text-white`}
                    data-testid={`badge-status-${doc.id}`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span data-testid={`text-license-type-${doc.id}`}>
                    {doc.licenseType.charAt(0).toUpperCase() + doc.licenseType.slice(1)} License
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid={`text-upload-date-${doc.id}`}>
                    Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {doc.fileSize && (
                  <div className="text-sm text-muted-foreground">
                    Size: {formatFileSize(doc.fileSize)}
                  </div>
                )}

                {doc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${doc.id}`}>
                    {doc.description}
                  </p>
                )}

                {/* Rule Sets Preview */}
                {doc.ruleSets && doc.ruleSets.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">
                      Rule Sets: {doc.ruleSets.length}
                    </div>
                    {doc.ruleSets.slice(0, 2).map((ruleSet: any) => (
                      <div key={ruleSet.id} className="text-xs text-muted-foreground">
                        • Version {ruleSet.version} 
                        <Badge variant="outline" className="ml-2 text-xs">
                          {ruleSet.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-document-${doc.id}`}>
                    View Details
                  </Button>
                  {doc.status === 'processed' && (
                    <Button variant="secondary" size="sm" className="flex-1" data-testid={`button-view-rules-${doc.id}`}>
                      View Rules
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {documents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No license documents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No documents match your search criteria."
              : "Upload your first license document to start AI-powered royalty rule extraction."
            }
          </p>
          {!searchQuery && vendors.length === 0 && (
            <p className="text-sm text-orange-600 mb-4">
              ⚠️ Please create a vendor first before uploading license documents.
            </p>
          )}
          {!searchQuery && vendors.length > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-upload-first-license">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First License
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}