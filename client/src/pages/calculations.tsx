import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, FileText, Eye, Download, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CalculationsPage() {
  const [_, setLocation] = useLocation();
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch all calculations across all contracts
  const { data: calculations, isLoading } = useQuery({
    queryKey: ["/api/calculations/all"],
  });

  const handleViewDetails = async (calculation: any) => {
    // Fetch detailed calculation data including line items and rules
    const response = await fetch(`/api/calculations/${calculation.id}/details`);
    if (response.ok) {
      const details = await response.json();
      setSelectedCalculation(details);
      setDetailsOpen(true);
    }
  };

  const handleDownloadReport = async (calcId: string) => {
    window.open(`/api/calculations/${calcId}/invoice-pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const allCalculations = calculations?.calculations || [];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Royalty Calculator</h2>
          <p className="text-muted-foreground">
            View and manage all royalty calculations across your contracts
          </p>
        </div>
        <Button onClick={() => setLocation("/contracts")}>
          <FileText className="mr-2 h-4 w-4" />
          View Contracts
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCalculations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${allCalculations.reduce((sum: number, calc: any) => sum + (parseFloat(calc.totalRoyalty) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Calculation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${allCalculations.length > 0 ? (allCalculations.reduce((sum: number, calc: any) => sum + (parseFloat(calc.totalRoyalty) || 0), 0) / allCalculations.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculations List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allCalculations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No calculations found. Upload sales data and calculate royalties from your contracts.
              </p>
              <Button className="mt-4" onClick={() => setLocation("/contracts")}>
                Go to Contracts
              </Button>
            </CardContent>
          </Card>
        ) : (
          allCalculations.map((calc: any) => (
            <Card key={calc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{calc.name}</CardTitle>
                    <CardDescription className="mt-1">{calc.contractName}</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {calc.itemsProcessed || 0} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {calc.createdAt ? format(new Date(calc.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Royalty:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${parseFloat(calc.totalRoyalty || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(calc)}
                      data-testid={`button-view-details-${calc.id}`}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadReport(calc.id)}
                      data-testid={`button-download-${calc.id}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setLocation(`/contracts/${calc.contractId}/rules`)}
                    data-testid={`button-view-rules-${calc.id}`}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Calculation Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculation Details</DialogTitle>
            <DialogDescription>
              {selectedCalculation?.name} - {selectedCalculation?.contractName}
            </DialogDescription>
          </DialogHeader>

          {selectedCalculation && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calculation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Items Processed:</span>
                    <span className="font-medium">{selectedCalculation.itemsProcessed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Royalty Amount:</span>
                    <span className="font-bold text-lg text-green-600">
                      ${parseFloat(selectedCalculation.totalRoyalty || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculation Date:</span>
                    <span className="font-medium">
                      {selectedCalculation.createdAt ? format(new Date(selectedCalculation.createdAt), 'PPP') : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Applied Rules */}
              {selectedCalculation.appliedRules && selectedCalculation.appliedRules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Applied Royalty Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCalculation.appliedRules.map((rule: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="font-medium">{rule.ruleName}</div>
                          <div className="text-sm text-muted-foreground mt-1">{rule.description}</div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{rule.ruleType}</Badge>
                            {rule.rate && <Badge variant="outline">{rule.rate}% rate</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Breakdown */}
              {selectedCalculation.lineItems && selectedCalculation.lineItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transaction Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Sales Amount</TableHead>
                          <TableHead>Rule Applied</TableHead>
                          <TableHead className="text-right">Royalty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCalculation.lineItems.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              ${parseFloat(item.salesAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.ruleName || 'Default'}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              ${parseFloat(item.royaltyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Uploaded File Info */}
              {selectedCalculation.uploadedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Uploaded Transaction File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedCalculation.uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCalculation.uploadedFile.size} • Uploaded {format(new Date(selectedCalculation.uploadedFile.uploadedAt), 'PPP')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
