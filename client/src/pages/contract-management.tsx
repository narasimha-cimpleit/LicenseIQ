import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, CheckCircle, XCircle, Clock, FileText, History, ThumbsUp, ThumbsDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function ContractManagement() {
  const [, params] = useRoute("/contracts/:id/manage");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const contractId = params?.id;

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [effectiveStart, setEffectiveStart] = useState("");
  const [effectiveEnd, setEffectiveEnd] = useState("");
  const [renewalTerms, setRenewalTerms] = useState("");
  const [governingLaw, setGoverningLaw] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [contractType, setContractType] = useState("");
  const [priority, setPriority] = useState("normal");
  const [notes, setNotes] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  
  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch contract data
  const { data: contract, isLoading } = useQuery({
    queryKey: [`/api/contracts/${contractId}`],
    enabled: !!contractId,
  });

  // Fetch version history
  const { data: versionsData } = useQuery({
    queryKey: [`/api/contracts/${contractId}/versions`],
    enabled: !!contractId,
  });

  const versions = versionsData?.versions || [];
  
  // Check if current user can approve (admin or owner)
  const canApprove = user?.role === 'admin' || user?.role === 'owner';

  // Initialize form with contract data
  useEffect(() => {
    if (contract) {
      setDisplayName(contract.displayName || contract.originalName || "");
      setEffectiveStart(contract.effectiveStart ? format(new Date(contract.effectiveStart), "yyyy-MM-dd") : "");
      setEffectiveEnd(contract.effectiveEnd ? format(new Date(contract.effectiveEnd), "yyyy-MM-dd") : "");
      setRenewalTerms(contract.renewalTerms || "");
      setGoverningLaw(contract.governingLaw || "");
      setCounterpartyName(contract.counterpartyName || "");
      setContractType(contract.contractType || "");
      setPriority(contract.priority || "normal");
      setNotes(contract.notes || "");
    }
  }, [contract]);

  // Update metadata mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!changeSummary.trim()) {
        throw new Error("Please describe what changed");
      }

      const metadata = {
        displayName,
        effectiveStart: effectiveStart || undefined,
        effectiveEnd: effectiveEnd || undefined,
        renewalTerms,
        governingLaw,
        counterpartyName,
        contractType,
        priority,
        notes,
        changeSummary,
      };

      return await apiRequest("PATCH", `/api/contracts/${contractId}/metadata`, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/versions`] });
      toast({
        title: "Success",
        description: "Contract metadata updated successfully",
      });
      setChangeSummary(""); // Reset change summary
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contract metadata",
        variant: "destructive",
      });
    },
  });

  // Submit for approval mutation
  const submitApprovalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/contracts/${contractId}/submit-approval`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/versions`] });
      toast({
        title: "Success",
        description: "Contract submitted for approval",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit for approval",
        variant: "destructive",
      });
    },
  });

  // Approve version mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVersionId) throw new Error("No version selected");
      return await apiRequest("POST", `/api/contracts/versions/${selectedVersionId}/approve`, {
        notes: approvalNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/versions`] });
      toast({
        title: "Approved",
        description: "Contract version approved successfully",
      });
      setApprovalDialogOpen(false);
      setApprovalNotes("");
      setSelectedVersionId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve version",
        variant: "destructive",
      });
    },
  });

  // Reject version mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVersionId) throw new Error("No version selected");
      if (!approvalNotes.trim()) throw new Error("Please provide a reason for rejection");
      return await apiRequest("POST", `/api/contracts/versions/${selectedVersionId}/reject`, {
        notes: approvalNotes.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/versions`] });
      toast({
        title: "Rejected",
        description: "Contract version rejected",
      });
      setApprovalDialogOpen(false);
      setApprovalNotes("");
      setSelectedVersionId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject version",
        variant: "destructive",
      });
    },
  });

  const handleApprovalAction = (action: 'approve' | 'reject', versionId: string) => {
    setApprovalAction(action);
    setSelectedVersionId(versionId);
    setApprovalDialogOpen(true);
  };

  const handleConfirmApproval = () => {
    if (approvalAction === 'approve') {
      approveMutation.mutate();
    } else if (approvalAction === 'reject') {
      rejectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" data-testid="loading-spinner" />
          <p className="mt-4 text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Contract not found</h3>
        <Button onClick={() => navigate("/contracts")} data-testid="button-back-contracts">
          Back to Contracts
        </Button>
      </div>
    );
  }

  const getApprovalBadge = (state: string) => {
    switch (state) {
      case "approved":
        return <Badge className="bg-green-500" data-testid="badge-approved"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="badge-rejected"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "pending_approval":
        return <Badge variant="secondary" data-testid="badge-pending"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-draft">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="contract-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contracts")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Contract Management</h1>
            <p className="text-muted-foreground" data-testid="text-contract-number">
              {contract.contractNumber || contract.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getApprovalBadge(contract.approvalState)}
          <Badge variant="outline" data-testid="badge-version">
            Version {contract.currentVersion || 1}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="metadata" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metadata" data-testid="tab-metadata">
            <FileText className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">
            <History className="h-4 w-4 mr-2" />
            Version History
          </TabsTrigger>
        </TabsList>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <Card data-testid="card-metadata">
            <CardHeader>
              <CardTitle>Contract Metadata</CardTitle>
              <CardDescription>
                Edit contract details and metadata. Changes will create a new version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Contract Name *</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter contract name"
                    data-testid="input-display-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="counterpartyName">Counterparty Name</Label>
                  <Input
                    id="counterpartyName"
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    placeholder="Other party in the contract"
                    data-testid="input-counterparty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveStart">Effective Start Date</Label>
                  <Input
                    id="effectiveStart"
                    type="date"
                    value={effectiveStart}
                    onChange={(e) => setEffectiveStart(e.target.value)}
                    data-testid="input-effective-start"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveEnd">Effective End Date</Label>
                  <Input
                    id="effectiveEnd"
                    type="date"
                    value={effectiveEnd}
                    onChange={(e) => setEffectiveEnd(e.target.value)}
                    data-testid="input-effective-end"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Input
                    id="contractType"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    placeholder="e.g., License, Service, Partnership"
                    data-testid="input-contract-type"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="governingLaw">Governing Law</Label>
                  <Input
                    id="governingLaw"
                    value={governingLaw}
                    onChange={(e) => setGoverningLaw(e.target.value)}
                    placeholder="Jurisdiction"
                    data-testid="input-governing-law"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewalTerms">Renewal Terms</Label>
                <Textarea
                  id="renewalTerms"
                  value={renewalTerms}
                  onChange={(e) => setRenewalTerms(e.target.value)}
                  placeholder="Describe renewal terms and conditions"
                  rows={3}
                  data-testid="textarea-renewal-terms"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or comments"
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="changeSummary">Change Summary *</Label>
                <Input
                  id="changeSummary"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Briefly describe what changed"
                  data-testid="input-change-summary"
                />
                <p className="text-sm text-muted-foreground">
                  Required: Explain what changes you made to the contract metadata
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !changeSummary.trim()}
                  data-testid="button-save-changes"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {contract.approvalState === "draft" && (
                  <Button
                    variant="secondary"
                    onClick={() => submitApprovalMutation.mutate()}
                    disabled={submitApprovalMutation.isPending}
                    data-testid="button-submit-approval"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version History Tab */}
        <TabsContent value="versions" className="space-y-4">
          <Card data-testid="card-version-history">
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                View all versions of this contract and their changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-versions">
                  No version history available
                </p>
              ) : (
                <div className="space-y-4">
                  {versions.map((version: any) => (
                    <div
                      key={version.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`version-${version.versionNumber}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" data-testid={`badge-version-${version.versionNumber}`}>
                            Version {version.versionNumber}
                          </Badge>
                          {getApprovalBadge(version.approvalState)}
                        </div>
                        <span className="text-sm text-muted-foreground" data-testid={`text-version-date-${version.versionNumber}`}>
                          {format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm font-medium" data-testid={`text-change-summary-${version.versionNumber}`}>
                        {version.changeSummary || "No summary provided"}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <span data-testid={`text-editor-${version.versionNumber}`}>
                          Edited by: User ID {version.editorId}
                        </span>
                      </div>
                      
                      {/* Approval Actions - Only show for admins when version is pending */}
                      {canApprove && version.approvalState === 'pending_approval' && user?.id !== version.editorId && (
                        <div className="flex items-center space-x-2 pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleApprovalAction('approve', version.id)}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-${version.versionNumber}`}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApprovalAction('reject', version.id)}
                            data-testid={`button-reject-${version.versionNumber}`}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Show if user can't approve their own version */}
                      {canApprove && version.approvalState === 'pending_approval' && user?.id === version.editorId && (
                        <p className="text-sm text-muted-foreground italic pt-2 border-t">
                          You cannot approve your own changes
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent data-testid="dialog-approval">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Contract Version' : 'Reject Contract Version'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'You can add optional notes about this approval.'
                : 'Please explain why this version is being rejected.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approvalNotes">
                {approvalAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason (Required)'}
              </Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={approvalAction === 'approve' 
                  ? 'Add any notes about this approval...'
                  : 'Explain what needs to be changed...'}
                rows={4}
                data-testid="textarea-approval-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialogOpen(false);
                setApprovalNotes("");
              }}
              data-testid="button-cancel-approval"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={
                (approvalAction === 'reject' && !approvalNotes.trim()) ||
                approveMutation.isPending ||
                rejectMutation.isPending
              }
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              data-testid="button-confirm-approval"
            >
              {approveMutation.isPending || rejectMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  {approvalAction === 'approve' ? (
                    <><ThumbsUp className="h-4 w-4 mr-2" />Approve</>
                  ) : (
                    <><ThumbsDown className="h-4 w-4 mr-2" />Reject</>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
