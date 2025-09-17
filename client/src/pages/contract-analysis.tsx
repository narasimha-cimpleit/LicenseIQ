import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Download, 
  Edit, 
  Eye, 
  Share, 
  Flag,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Clock,
  User,
  Calendar,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ContractAnalysis() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Move mutation hooks to top level to avoid conditional hook calls
  const reprocessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/contracts/${id}/reprocess`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reprocessing Started",
        description: "The document is being reanalyzed with improved AI detection.",
      });
      // Invalidate and refetch contract data
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Reprocessing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/contracts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Deleted",
        description: "The contract has been permanently deleted.",
      });
      // Redirect to contracts list
      setLocation("/contracts");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const flagMutation = useMutation({
    mutationFn: async (flagged: boolean) => {
      const response = await apiRequest("PATCH", `/api/contracts/${id}/flag`, { flagged });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}`] });
      toast({
        title: data.flagged ? "Flagged for Review" : "Flag Removed",
        description: data.flagged 
          ? "Contract has been flagged for review by administrators."
          : "Review flag has been removed from this contract.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to update flag status.",
        variant: "destructive",
      });
    },
  });

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ["/api/contracts", id],
    enabled: !!id,
    retry: false,
    refetchInterval: 2000, // Refresh every 2s
    refetchIntervalInBackground: false,
  });

  // Handle unauthorized errors
  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout title="Loading..." description="Loading contract analysis">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-96" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex space-x-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!contract || !contract.id) {
    return (
      <MainLayout title="Contract Not Found" description="The requested contract could not be found">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Contract Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The contract you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => setLocation("/contracts")}>
              Back to Contracts
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const analysis = contract?.analysis;
  const hasAnalysis = analysis && contract?.status === 'analyzed';

  const handleViewOriginal = () => {
    // Open the original PDF file in a new window
    window.open(`/api/contracts/${id}/file`, '_blank');
  };

  const handleDownloadReport = async () => {
    try {
      const response = await apiRequest("GET", `/api/contracts/${id}/report`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract?.originalName || 'contract'}_analysis_report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Report Downloaded",
          description: "Analysis report has been downloaded successfully.",
        });
      } else {
        throw new Error('Failed to download report');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download analysis report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareAnalysis = async () => {
    try {
      const shareData = {
        title: `${contract?.originalName || 'Contract'} Analysis`,
        text: analysis?.summary || 'Contract Analysis Report',
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Analysis has been shared.",
        });
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Analysis link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share Failed",
        description: "Unable to share analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFlagForReview = () => {
    const isCurrentlyFlagged = contract?.flaggedForReview || false;
    flagMutation.mutate(!isCurrentlyFlagged);
  };

  const handleExport = () => {
    handleDownloadReport();
  };

  const handleReprocess = () => {
    reprocessMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
      case 'low':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  return (
    <MainLayout 
      title={`${contract?.originalName || 'Contract'} Analysis`}
      description={`${hasAnalysis ? 'Processed' : 'Processing'} ${contract?.createdAt ? formatDistanceToNow(new Date(contract.createdAt), { addSuffix: true }) : 'recently'}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge 
              variant={contract?.status === 'analyzed' ? 'default' : 
                      contract?.status === 'processing' ? 'secondary' : 'outline'}
            >
              {contract?.status}
            </Badge>
            {hasAnalysis && analysis.confidence && (
              <Badge variant="outline" className={getConfidenceColor(parseFloat(analysis.confidence))}>
                {Math.round(parseFloat(analysis.confidence) * 100)}% confidence
              </Badge>
            )}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleReprocess} 
              disabled={reprocessMutation.isPending}
              data-testid="button-reprocess"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
              {reprocessMutation.isPending ? "Reprocessing..." : "Reprocess"}
            </Button>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2 text-blue-400" />
              Export
            </Button>
            <Button data-testid="button-edit-analysis">
              <Edit className="h-4 w-4 mr-2 text-green-400" />
              Edit Analysis
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  data-testid="button-delete-contract"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{contract?.originalName}"? This action cannot be undone. 
                    The contract file and all analysis data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Contract"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {!hasAnalysis ? (
          /* Processing State */
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {contract?.status === 'processing' ? 'Analysis in Progress' : 'Waiting for Analysis'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {contract?.status === 'processing' 
                  ? 'Our AI is analyzing your contract. This usually takes a few minutes.'
                  : contract?.status === 'failed'
                  ? 'Analysis failed. Please try uploading the contract again.'
                  : 'Analysis will begin shortly.'
                }
              </p>
              {contract?.status !== 'failed' && (
                <Button variant="outline" onClick={() => setLocation("/contracts")}>
                  Back to Contracts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            {/* Key Contract Details - Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Parties Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contract Parties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Licensor</p>
                    <p className="text-sm font-medium" data-testid="text-licensor">
                      {analysis.licensor || "Not identified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Licensee</p>
                    <p className="text-sm font-medium" data-testid="text-licensee">
                      {analysis.licensee || "Not identified"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Dates Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Key Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
                    <p className="text-sm font-medium" data-testid="text-start-date">
                      {analysis.startDate || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">End Date</p>
                    <p className="text-sm font-medium" data-testid="text-end-date">
                      {analysis.endDate || analysis.expirationDate || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Terms Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Financial Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Terms</p>
                    <p className="text-sm font-medium" data-testid="text-payment-terms">
                      {analysis.paymentTerms || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount/Rate</p>
                    <p className="text-sm font-medium" data-testid="text-amount">
                      {analysis.contractValue || analysis.royaltyRate || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Agreement Type Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Agreement Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Agreement Type</p>
                    <p className="text-sm font-medium" data-testid="text-agreement-type">
                      {analysis.agreementType || contract?.contractType || "Not identified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Jurisdiction</p>
                    <p className="text-sm font-medium" data-testid="text-jurisdiction">
                      {analysis.jurisdiction || analysis.governingLaw || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Analysis Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <p>{analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Terms */}
              {analysis.keyTerms && analysis.keyTerms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Extracted Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.keyTerms.map((term: any, index: number) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{term.type}</span>
                            <Badge variant="outline" className={getConfidenceColor(term.confidence)}>
                              {Math.round(term.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{term.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Found in: {term.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk Analysis */}
              {analysis.riskAnalysis && analysis.riskAnalysis.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.riskAnalysis.map((risk: any, index: number) => (
                        <div key={index} className={`p-4 rounded-lg border ${getRiskLevelColor(risk.level)}`}>
                          <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-medium capitalize">{risk.level} Risk - {risk.title}</span>
                              <p className="text-sm mt-1">{risk.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.insights.map((insight: any, index: number) => (
                        <div key={index} className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start space-x-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Lightbulb className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-blue-900 dark:text-blue-100">{insight.title}</h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{insight.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Contract Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Name:</span>
                      <span className="text-foreground font-medium">{contract?.originalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="text-foreground">{((contract?.fileSize || 0) / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground capitalize">{contract?.contractType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className="capitalize">{contract?.priority}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload Date:</span>
                      <span className="text-foreground">{contract?.createdAt ? new Date(contract.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    {contract?.uploadedByUser && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded By:</span>
                        <span className="text-foreground">
                          {contract?.uploadedByUser?.firstName && contract?.uploadedByUser?.lastName
                            ? `${contract.uploadedByUser.firstName} ${contract.uploadedByUser.lastName}`
                            : contract?.uploadedByUser?.email
                          }
                        </span>
                      </div>
                    )}
                    {analysis?.processingTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing Time:</span>
                        <span className="text-foreground">{analysis.processingTime}s</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleViewOriginal}
                      data-testid="button-view-original"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Original Document
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleDownloadReport}
                      data-testid="button-download-analysis"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Analysis Report
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleShareAnalysis}
                      data-testid="button-share-analysis"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share Analysis
                    </Button>
                    <Button
                      variant={contract?.flaggedForReview ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={handleFlagForReview}
                      disabled={flagMutation.isPending}
                      data-testid="button-flag-review"
                    >
                      <Flag className={`h-4 w-4 mr-2 ${contract?.flaggedForReview ? 'text-white' : ''}`} />
                      {contract?.flaggedForReview ? 'Remove Flag' : 'Flag for Review'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {contract?.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{contract?.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
