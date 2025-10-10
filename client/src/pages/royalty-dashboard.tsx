import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function RoyaltyDashboard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [calculationName, setCalculationName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch contract details
  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ["/api/contracts", id],
    enabled: !!id,
  });

  // Fetch sales data for this contract
  const { data: salesResponse, isLoading: salesLoading } = useQuery({
    queryKey: [`/api/contracts/${id}/sales`],
    enabled: !!id,
  });

  // Fetch royalty calculations
  const { data: calculationsResponse, isLoading: calculationsLoading } = useQuery({
    queryKey: [`/api/contracts/${id}/royalty-calculations`],
    enabled: !!id,
  });

  const salesData = salesResponse?.salesData || [];
  const calculations = calculationsResponse?.calculations || [];
  const latestCalculation = calculations[0];

  const calculateMutation = useMutation({
    mutationFn: async () => {
      setIsCalculating(true);
      const response = await apiRequest("POST", `/api/contracts/${id}/calculate-royalties`, {
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        name: calculationName || undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsCalculating(false);
      setIsDialogOpen(false);
      toast({
        title: "Calculation Complete",
        description: data.message || "Royalties calculated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}/royalty-calculations`] });
    },
    onError: (error: Error) => {
      setIsCalculating(false);
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Prepare chart data
  const chartData = latestCalculation?.breakdown?.slice(0, 10).map((item: any, index: number) => ({
    name: item.productName || item.transactionId || `Sale ${index + 1}`,
    sales: parseFloat(item.saleAmount || 0),
    royalty: parseFloat(item.royaltyAmount || 0),
  })) || [];

  const pieData = [
    { name: "Sales Amount", value: parseFloat(latestCalculation?.totalSalesAmount || 0), color: "#8b5cf6" },
    { name: "Royalty", value: parseFloat(latestCalculation?.totalRoyalty || 0), color: "#ec4899" },
  ];

  const COLORS = ["#8b5cf6", "#ec4899"];

  if (contractLoading || salesLoading || calculationsLoading) {
    return (
      <MainLayout
        title="Royalty Calculator"
        description="Calculate and manage royalty payments"
      >
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Royalty Calculator"
      description={`Calculate royalties for ${contract?.name || 'contract'}`}
    >
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation(`/contracts/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contract
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Sales Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{salesData.length}</div>
              <p className="text-xs text-purple-100 mt-1">Total matched sales</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${parseFloat(latestCalculation?.totalSalesAmount || "0").toLocaleString()}
              </div>
              <p className="text-xs text-pink-100 mt-1">Gross revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Royalty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${parseFloat(latestCalculation?.totalRoyalty || "0").toLocaleString()}
              </div>
              <p className="text-xs text-blue-100 mt-1">Amount owed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{calculations.length}</div>
              <p className="text-xs text-green-100 mt-1">Total runs</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Royalties
            </CardTitle>
            <CardDescription>
              Calculate royalties based on matched sales data. 
              {salesData.length === 0 && " Please upload sales data first."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={salesData.length === 0}
                  data-testid="button-trigger-calculation"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Run Calculation
                </Button>
              </DialogTrigger>
              <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Calculate Royalties</DialogTitle>
                  <DialogDescription>
                    Configure the calculation parameters for this contract.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="calc-name">Calculation Name</Label>
                    <Input
                      id="calc-name"
                      placeholder="Q1 2024 Royalties"
                      value={calculationName}
                      onChange={(e) => setCalculationName(e.target.value)}
                      data-testid="input-calculation-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period-start">Period Start (Optional)</Label>
                      <Input
                        id="period-start"
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        data-testid="input-period-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period-end">Period End (Optional)</Label>
                      <Input
                        id="period-end"
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        data-testid="input-period-end"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Total Sales Data:</strong> {salesData.length} transactions
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => calculateMutation.mutate()}
                    disabled={isCalculating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    data-testid="button-confirm-calculation"
                  >
                    {isCalculating ? "Calculating..." : "Calculate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {latestCalculation && chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales & Royalty Breakdown
              </CardTitle>
              <CardDescription>
                Top {chartData.length} transactions with highest sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8b5cf6" name="Sales Amount" />
                  <Bar dataKey="royalty" fill="#ec4899" name="Royalty Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {latestCalculation && pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Revenue Distribution
              </CardTitle>
              <CardDescription>
                Sales amount vs Royalty amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Calculation History
            </CardTitle>
            <CardDescription>
              Previous royalty calculations for this contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No calculations yet. Run your first calculation above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calculations.map((calc: any) => (
                  <div
                    key={calc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    data-testid={`calculation-${calc.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{calc.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {calc.createdAt ? format(new Date(calc.createdAt), "PPP") : "N/A"}
                        </span>
                        <span>{calc.salesCount} transactions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Sales</p>
                        <p className="font-semibold">${parseFloat(calc.totalSalesAmount || "0").toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Royalty</p>
                        <p className="font-semibold text-purple-600">${parseFloat(calc.totalRoyalty || "0").toLocaleString()}</p>
                      </div>
                      <Badge variant={calc.status === "approved" ? "default" : calc.status === "rejected" ? "destructive" : "secondary"}>
                        {calc.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {calc.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {calc.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {calc.status || "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {salesData.length === 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    No Sales Data Yet
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    To calculate royalties, you need to upload sales data first. Go to the{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-blue-600 dark:text-blue-400"
                      onClick={() => setLocation("/sales-upload")}
                    >
                      Sales Data
                    </Button>{" "}
                    page to upload your sales transactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
