import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS = {
  pending_approval: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
  paid: "#6366f1",
};

const STATUS_ICONS = {
  pending_approval: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  paid: DollarSign,
};

export default function RoyaltyDashboard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; action: "approve" | "reject"; id: string | null }>({
    open: false,
    action: "approve",
    id: null,
  });
  const [comments, setComments] = useState("");

  const { data: calculation, isLoading } = useQuery({
    queryKey: ["/api/royalty-calculations", id],
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ calculationId, comments }: { calculationId: string; comments?: string }) => {
      const response = await apiRequest("POST", `/api/royalty-calculations/${calculationId}/approve`, { comments });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approved",
        description: "Royalty calculation has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/royalty-calculations", id] });
      setApprovalDialog({ open: false, action: "approve", id: null });
      setComments("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ calculationId, reason }: { calculationId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/royalty-calculations/${calculationId}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rejected",
        description: "Royalty calculation has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/royalty-calculations", id] });
      setApprovalDialog({ open: false, action: "reject", id: null });
      setComments("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApproval = () => {
    if (!approvalDialog.id) return;

    if (approvalDialog.action === "approve") {
      approveMutation.mutate({ calculationId: approvalDialog.id, comments });
    } else {
      if (!comments.trim()) {
        toast({
          title: "Rejection reason required",
          description: "Please provide a reason for rejection.",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({ calculationId: approvalDialog.id, reason: comments });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!calculation) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Calculation Not Found</h2>
            <p className="text-muted-foreground">The royalty calculation you're looking for doesn't exist.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const StatusIcon = STATUS_ICONS[calculation.status as keyof typeof STATUS_ICONS] || Clock;

  // Prepare chart data from breakdown
  const chartData = calculation.chartData || {
    byProduct: [],
    byMonth: [],
    topSales: [],
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-calculation-name">{calculation.name}</h1>
            <p className="text-muted-foreground mt-1">
              Contract: {calculation.contractName || "Unknown"}
            </p>
          </div>
          <Badge
            className="text-lg px-4 py-2"
            style={{ backgroundColor: STATUS_COLORS[calculation.status as keyof typeof STATUS_COLORS] }}
            data-testid={`badge-status-${calculation.status}`}
          >
            <StatusIcon className="h-5 w-5 mr-2" />
            {calculation.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Royalty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600" data-testid="text-total-royalty">
                ${parseFloat(calculation.totalRoyalty || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{calculation.currency || "USD"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-sales">
                ${parseFloat(calculation.totalSalesAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{calculation.salesCount || 0} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {calculation.periodStart && calculation.periodEnd ? (
                  <>
                    {new Date(calculation.periodStart).toLocaleDateString()} - {new Date(calculation.periodEnd).toLocaleDateString()}
                  </>
                ) : (
                  "All Time"
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calculated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">
                {formatDistanceToNow(new Date(calculation.createdAt), { addSuffix: true })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">by {calculation.calculatedByName || "System"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Royalty by Product Category */}
          {chartData.byProduct && chartData.byProduct.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Royalty by Product Category</CardTitle>
                <CardDescription>Distribution of royalties across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.byProduct}
                      dataKey="royalty"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: $${entry.royalty.toFixed(2)}`}
                    >
                      {chartData.byProduct.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Sales Transactions */}
          {chartData.topSales && chartData.topSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Royalty Transactions</CardTitle>
                <CardDescription>Highest royalty-generating sales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.topSales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="royalty" fill="#10b981" name="Royalty Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Breakdown</CardTitle>
            <CardDescription>Detailed transaction-by-transaction royalty calculation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Product</th>
                    <th className="text-right p-2">Sales Amount</th>
                    <th className="text-right p-2">Royalty</th>
                    <th className="text-left p-2">Rules Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.breakdown && calculation.breakdown.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50" data-testid={`row-sale-${idx}`}>
                      <td className="p-2">{new Date(item.transactionDate).toLocaleDateString()}</td>
                      <td className="p-2">{item.productName || "N/A"}</td>
                      <td className="p-2 text-right">${parseFloat(item.grossAmount || "0").toFixed(2)}</td>
                      <td className="p-2 text-right font-semibold text-green-600">
                        ${item.royaltyAmount.toFixed(2)}
                      </td>
                      <td className="p-2">{item.rulesApplied || 0} rules</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Approval Section */}
        {calculation.status === "pending_approval" && (
          <Card className="border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pending Approval
              </CardTitle>
              <CardDescription>Review and approve or reject this royalty calculation</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={() => setApprovalDialog({ open: true, action: "approve", id: calculation.id })}
                className="flex-1"
                data-testid="button-approve"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setApprovalDialog({ open: true, action: "reject", id: calculation.id })}
                className="flex-1"
                data-testid="button-reject"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Approval/Rejection History */}
        {(calculation.approvedBy || calculation.rejectedBy) && (
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {calculation.approvedBy && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Approved by {calculation.approvedByName} on {new Date(calculation.approvedAt).toLocaleString()}</span>
                </div>
              )}
              {calculation.rejectedBy && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Rejected by {calculation.rejectedByName} on {new Date(calculation.rejectedAt).toLocaleString()}</span>
                  {calculation.rejectionReason && (
                    <p className="text-sm text-muted-foreground mt-1">Reason: {calculation.rejectionReason}</p>
                  )}
                </div>
              )}
              {calculation.comments && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm"><strong>Comments:</strong> {calculation.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approval/Rejection Dialog */}
        <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}>
          <DialogContent data-testid="dialog-approval">
            <DialogHeader>
              <DialogTitle>
                {approvalDialog.action === "approve" ? "Approve Royalty Calculation" : "Reject Royalty Calculation"}
              </DialogTitle>
              <DialogDescription>
                {approvalDialog.action === "approve"
                  ? "You are about to approve this royalty calculation. This action will mark it as approved and ready for payment."
                  : "You are about to reject this royalty calculation. Please provide a reason for rejection."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comments">
                  {approvalDialog.action === "approve" ? "Comments (Optional)" : "Rejection Reason (Required)"}
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    approvalDialog.action === "approve"
                      ? "Add any additional comments..."
                      : "Explain why you're rejecting this calculation..."
                  }
                  rows={4}
                  data-testid="input-comments"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApprovalDialog({ open: false, action: "approve", id: null });
                  setComments("");
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproval}
                variant={approvalDialog.action === "approve" ? "default" : "destructive"}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                data-testid="button-confirm"
              >
                {approvalDialog.action === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
