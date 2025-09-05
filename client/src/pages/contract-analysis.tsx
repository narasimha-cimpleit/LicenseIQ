import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ContractAnalysis() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

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

  if (!contract) {
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

  const analysis = contract.analysis;
  const hasAnalysis = analysis && contract.status === 'analyzed';

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your analysis report is being prepared for download.",
    });
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
      title={`${contract.originalName} Analysis`}
      description={`${hasAnalysis ? 'Processed' : 'Processing'} ${formatDistanceToNow(new Date(contract.createdAt), { addSuffix: true })}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge 
              variant={contract.status === 'analyzed' ? 'default' : 
                      contract.status === 'processing' ? 'secondary' : 'outline'}
            >
              {contract.status}
            </Badge>
            {hasAnalysis && analysis.confidence && (
              <Badge variant="outline" className={getConfidenceColor(parseFloat(analysis.confidence))}>
                {Math.round(parseFloat(analysis.confidence) * 100)}% confidence
              </Badge>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button data-testid="button-edit-analysis">
              <Edit className="h-4 w-4 mr-2" />
              Edit Analysis
            </Button>
          </div>
        </div>

        {!hasAnalysis ? (
          /* Processing State */
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {contract.status === 'processing' ? 'Analysis in Progress' : 'Waiting for Analysis'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {contract.status === 'processing' 
                  ? 'Our AI is analyzing your contract. This usually takes a few minutes.'
                  : contract.status === 'failed'
                  ? 'Analysis failed. Please try uploading the contract again.'
                  : 'Analysis will begin shortly.'
                }
              </p>
              {contract.status !== 'failed' && (
                <Button variant="outline" onClick={() => setLocation("/contracts")}>
                  Back to Contracts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Analysis Results */
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
                      <span className="text-foreground font-medium">{contract.originalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="text-foreground">{(contract.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground capitalize">{contract.contractType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className="capitalize">{contract.priority}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload Date:</span>
                      <span className="text-foreground">{new Date(contract.createdAt).toLocaleDateString()}</span>
                    </div>
                    {contract.uploadedByUser && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded By:</span>
                        <span className="text-foreground">
                          {contract.uploadedByUser.firstName && contract.uploadedByUser.lastName
                            ? `${contract.uploadedByUser.firstName} ${contract.uploadedByUser.lastName}`
                            : contract.uploadedByUser.email
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
                      data-testid="button-view-original"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Original Document
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleExport}
                      data-testid="button-download-analysis"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Analysis Report
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-testid="button-share-analysis"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share Analysis
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-testid="button-flag-review"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Flag for Review
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {contract.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{contract.notes}</p>
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
