import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Play, CheckCircle2, XCircle, AlertCircle, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";

export default function RoyaltyRunsPage() {
  const [viewingRunId, setViewingRunId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    vendorId: "",
    ruleSetId: "",
    periodStart: "",
    periodEnd: "",
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const { data: runsData, isLoading } = useQuery({
    queryKey: ["/api/royalty-runs"],
  });

  const { data: runDetails } = useQuery({
    queryKey: ["/api/royalty-runs", viewingRunId],
    enabled: !!viewingRunId,
  });

  const vendors = vendorsData?.vendors || [];
  const runs = runsData?.runs || [];

  const selectedVendor = vendors.find((v: any) => v.id === formData.vendorId);
  const ruleSets = selectedVendor?.ruleSets || [];

  const createRunMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/royalty-runs", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Royalty run created and calculation started",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/royalty-runs"] });
      setFormData({ name: "", vendorId: "", ruleSetId: "", periodStart: "", periodEnd: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create royalty run",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (runId: string) => {
      const response = await apiRequest("POST", `/api/royalty-runs/${runId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Royalty run approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/royalty-runs"] });
      setViewingRunId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve royalty run",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (runId: string) => {
      const response = await apiRequest("POST", `/api/royalty-runs/${runId}/reject`, {
        reason: rejectionReason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Royalty run rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/royalty-runs"] });
      setViewingRunId(null);
      setShowRejectionForm(false);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject royalty run",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: AlertCircle },
      calculating: { variant: "default", icon: Calculator },
      awaiting_approval: { variant: "default", icon: AlertCircle },
      approved: { variant: "default", icon: CheckCircle2 },
      rejected: { variant: "destructive", icon: XCircle },
      failed: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold">Royalty Runs</h1>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Royalty Runs</h1>
          <p className="text-muted-foreground mt-1">
            Calculate and manage royalty payments with human-in-the-loop approval
          </p>
        </div>

        {/* Inline Create Royalty Run Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Create New Royalty Run
            </CardTitle>
            <CardDescription>
              Calculate royalties based on sales data and license rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Run Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  data-testid="input-run-name"
                  placeholder="Q4 2024 Royalties"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor <span className="text-red-500">*</span></Label>
                <Select value={formData.vendorId} onValueChange={(value) => setFormData({ ...formData, vendorId: value, ruleSetId: "" })}>
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
                <Label htmlFor="ruleSet">License Rules <span className="text-red-500">*</span></Label>
                <Select value={formData.ruleSetId} onValueChange={(value) => setFormData({ ...formData, ruleSetId: value })} disabled={!formData.vendorId}>
                  <SelectTrigger data-testid="select-rule-set">
                    <SelectValue placeholder="Select rule set" />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleSets.map((ruleSet: any) => (
                      <SelectItem key={ruleSet.id} value={ruleSet.id}>
                        {ruleSet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start <span className="text-red-500">*</span></Label>
                <Input
                  id="periodStart"
                  type="date"
                  data-testid="input-period-start"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End <span className="text-red-500">*</span></Label>
                <Input
                  id="periodEnd"
                  type="date"
                  data-testid="input-period-end"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setFormData({ name: "", vendorId: "", ruleSetId: "", periodStart: "", periodEnd: "" })}
                disabled={!formData.name && !formData.vendorId}
                data-testid="button-clear-form"
              >
                Clear
              </Button>
              <Button
                onClick={() => createRunMutation.mutate()}
                disabled={!formData.name || !formData.vendorId || !formData.ruleSetId || !formData.periodStart || !formData.periodEnd || createRunMutation.isPending}
                data-testid="button-confirm-run"
                className="gap-2"
              >
                {createRunMutation.isPending ? "Creating..." : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Create & Calculate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Royalty Runs List */}
        <Card>
          <CardHeader>
            <CardTitle>Royalty Runs</CardTitle>
            <CardDescription>View and manage royalty calculation runs</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No royalty runs yet</h3>
                <p className="text-muted-foreground">
                  Create your first royalty run to calculate payments
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Royalty</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run: any) => (
                    <TableRow key={run.id} data-testid={`row-run-${run.id}`}>
                      <TableCell className="font-medium">{run.name}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {run.totalRoyalty ? (
                          <span className="font-semibold text-green-600">
                            ${Number(run.totalRoyalty).toFixed(2)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {run.metadata?.recordsProcessed || 0}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingRunId(run.id)}
                          data-testid={`button-view-run-${run.id}`}
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

        {/* Run Details Inline View */}
        {viewingRunId && runDetails && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Royalty Run Details</CardTitle>
                  <CardDescription>
                    Review calculation results and approve or reject
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewingRunId(null);
                    setShowRejectionForm(false);
                    setRejectionReason("");
                  }}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      ${Number(runDetails.run.metadata?.totalSalesAmount || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Royalty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      ${Number(runDetails.run.totalRoyalty || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {runDetails.run.metadata?.recordsProcessed || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Calculation Results</h3>
                <div className="max-h-96 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Sales Amount</TableHead>
                        <TableHead>Royalty Rate</TableHead>
                        <TableHead>Royalty Amount</TableHead>
                        <TableHead>Rule Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runDetails.results?.slice(0, 50).map((result: any) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-mono text-sm">
                            {result.salesData?.transactionId || 'N/A'}
                          </TableCell>
                          <TableCell>${Number(result.salesAmount).toFixed(2)}</TableCell>
                          <TableCell>
                            {result.royaltyRate ? `${(Number(result.royaltyRate) * 100).toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${Number(result.royaltyAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {result.ruleId || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {runDetails.results?.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 50 of {runDetails.results.length} results
                  </p>
                )}
              </div>

              {/* Rejection Form */}
              {showRejectionForm && (
                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader>
                    <CardTitle className="text-base">Reject Royalty Run</CardTitle>
                    <CardDescription>
                      Please provide a reason for rejecting this royalty run
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Rejection Reason <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="reason"
                        data-testid="input-rejection-reason"
                        placeholder="Explain why this run is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectionForm(false);
                          setRejectionReason("");
                        }}
                        data-testid="button-cancel-reject"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => viewingRunId && rejectMutation.mutate(viewingRunId)}
                        disabled={!rejectionReason || rejectMutation.isPending}
                        data-testid="button-confirm-reject"
                      >
                        {rejectMutation.isPending ? "Rejecting..." : "Reject Run"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                {runDetails.run.status === 'awaiting_approval' && !showRejectionForm && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectionForm(true)}
                      data-testid="button-reject-run"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate(viewingRunId)}
                      disabled={approveMutation.isPending}
                      data-testid="button-approve-run"
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {approveMutation.isPending ? "Approving..." : "Approve Run"}
                    </Button>
                  </>
                )}
                {runDetails.run.status !== 'awaiting_approval' && (
                  <Button
                    variant="outline"
                    onClick={() => setViewingRunId(null)}
                    data-testid="button-close-run"
                  >
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
