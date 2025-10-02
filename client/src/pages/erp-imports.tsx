import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, FileUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";

export default function ErpImportsPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [viewingImportId, setViewingImportId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: vendorsData } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const { data: importsData, isLoading } = useQuery({
    queryKey: ["/api/erp-imports"],
  });

  const { data: stagingData } = useQuery({
    queryKey: ["/api/erp-imports", viewingImportId],
    enabled: !!viewingImportId,
  });

  const vendors = vendorsData?.vendors || [];
  const imports = importsData?.jobs || [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedVendorId) {
        throw new Error("Please select a file and vendor");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("vendorId", selectedVendorId);

      const response = await fetch("/api/erp-imports", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Imported ${data.summary.validRows} rows successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/erp-imports"] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedVendorId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (importId: string) => {
      const response = await apiRequest("POST", `/api/erp-imports/${importId}/promote`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Promoted ${data.promotedCount} records to sales data`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/erp-imports"] });
      setViewingImportId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to promote data",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      processing: { variant: "default", icon: AlertCircle },
      completed: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.processing;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold">ERP Data Imports</h1>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">ERP Data Imports</h1>
            <p className="text-muted-foreground mt-1">
              Import sales data from CSV/Excel files for royalty calculations
            </p>
          </div>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-sales-data" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Sales Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Sales Data</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file containing sales data from your ERP system
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger data-testid="select-vendor">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      data-testid="input-sales-file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile && (
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Accepts CSV and Excel files (max 50MB)
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!selectedFile || !selectedVendorId || uploadMutation.isPending}
                  data-testid="button-confirm-upload"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>View and manage your sales data imports</CardDescription>
          </CardHeader>
          <CardContent>
            {imports.length === 0 ? (
              <div className="text-center py-12">
                <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No imports yet</h3>
                <p className="text-muted-foreground">
                  Upload your first sales data file to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((job: any) => (
                    <TableRow key={job.id} data-testid={`row-import-${job.id}`}>
                      <TableCell className="font-medium">{job.fileName}</TableCell>
                      <TableCell>{job.jobType}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        {job.metadata?.recordsImported || 0} imported
                        {job.metadata?.recordsFailed > 0 && (
                          <span className="text-red-500 ml-2">
                            ({job.metadata.recordsFailed} failed)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(job.startedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingImportId(job.id)}
                          data-testid={`button-view-${job.id}`}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {viewingImportId && stagingData && (
          <Dialog open={!!viewingImportId} onOpenChange={() => setViewingImportId(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Details</DialogTitle>
                <DialogDescription>
                  Review staging data and validation results
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stagingData.stagingData?.length || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Valid Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {stagingData.stagingData?.filter((r: any) => r.validationStatus === 'valid').length || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagingData.stagingData?.slice(0, 50).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {row.validationStatus === 'valid' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>{row.rowData.transactionDate}</TableCell>
                        <TableCell>${Number(row.rowData.grossAmount).toFixed(2)}</TableCell>
                        <TableCell>{row.rowData.productName || '-'}</TableCell>
                        <TableCell className="text-red-500 text-sm">
                          {row.validationErrors || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setViewingImportId(null)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
                <Button
                  onClick={() => promoteMutation.mutate(viewingImportId)}
                  disabled={promoteMutation.isPending || stagingData.stagingData?.filter((r: any) => r.validationStatus === 'valid').length === 0}
                  data-testid="button-promote-data"
                >
                  {promoteMutation.isPending ? "Promoting..." : "Promote to Sales Data"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}
