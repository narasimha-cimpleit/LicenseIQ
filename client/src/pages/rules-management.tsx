import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface RoyaltyRule {
  id: string;
  contractId: string;
  ruleType: string;
  ruleName: string;
  description: string | null;
  productCategories: string[];
  territories: string[];
  containerSizes: string[];
  seasonalAdjustments: any[];
  territoryPremiums: any[];
  volumeTiers: any[];
  baseRate: string | null;
  minimumGuarantee: string | null;
  isActive: boolean;
  priority: number;
}

export default function RulesManagement() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [ruleToEdit, setRuleToEdit] = useState<RoyaltyRule | null>(null);

  // Fetch contract details
  const { data: contract } = useQuery({
    queryKey: [`/api/contracts/${id}`],
  });

  // Fetch royalty rules
  const { data: rulesData, isLoading } = useQuery<{ rules: RoyaltyRule[] }>({
    queryKey: [`/api/contracts/${id}/rules`],
    enabled: !!id,
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiRequest(`/api/contracts/${id}/rules/${ruleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}/rules`] });
      toast({
        title: "Rule deleted",
        description: "The royalty rule has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rule",
        variant: "destructive",
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      return apiRequest(`/api/contracts/${id}/rules/${ruleId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}/rules`] });
      toast({
        title: "Rule updated",
        description: "The rule status has been updated.",
      });
    },
  });

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (rule: RoyaltyRule) => {
    setRuleToEdit(rule);
    setEditDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteMutation.mutate(ruleToDelete);
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      tiered_pricing: "Tiered Pricing",
      minimum_guarantee: "Minimum Guarantee",
      seasonal_adjustment: "Seasonal Adjustment",
      territory_premium: "Territory Premium",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 dark:from-slate-950 dark:via-violet-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/contracts/${id}`)}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contract
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Royalty Rules Management
              </h1>
              <p className="text-muted-foreground mt-2">
                {contract?.originalName || "Loading..."}
              </p>
            </div>
            <Button
              onClick={() => {
                setRuleToEdit({
                  id: "",
                  contractId: id!,
                  ruleType: "tiered_pricing",
                  ruleName: "",
                  description: "",
                  productCategories: [],
                  territories: [],
                  containerSizes: [],
                  seasonalAdjustments: [],
                  territoryPremiums: [],
                  volumeTiers: [],
                  baseRate: null,
                  minimumGuarantee: null,
                  isActive: true,
                  priority: 1,
                } as RoyaltyRule);
                setEditDialogOpen(true);
              }}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
              data-testid="button-add-rule"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Rule
            </Button>
          </div>
        </div>

        {/* Rules List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading rules...</p>
          </div>
        ) : !rulesData?.rules || rulesData.rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No royalty rules found for this contract.</p>
              <Button
                onClick={() => {
                  setRuleToEdit({
                    id: "",
                    contractId: id!,
                    ruleType: "tiered_pricing",
                    ruleName: "",
                    description: "",
                    productCategories: [],
                    territories: [],
                    containerSizes: [],
                    seasonalAdjustments: [],
                    territoryPremiums: [],
                    volumeTiers: [],
                    baseRate: null,
                    minimumGuarantee: null,
                    isActive: true,
                    priority: 1,
                  } as RoyaltyRule);
                  setEditDialogOpen(true);
                }}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rulesData.rules.map((rule) => (
              <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""} data-testid={`card-rule-${rule.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle>{rule.ruleName}</CardTitle>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{getRuleTypeLabel(rule.ruleType)}</Badge>
                      </div>
                      {rule.description && (
                        <CardDescription className="mt-2">{rule.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ ruleId: rule.id, isActive: checked })}
                        data-testid={`switch-active-${rule.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(rule)}
                        data-testid={`button-edit-${rule.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rule.id)}
                        data-testid={`button-delete-${rule.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {rule.productCategories?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Product Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {rule.productCategories.map((cat, idx) => (
                            <Badge key={idx} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {rule.baseRate && (
                      <div>
                        <p className="text-sm font-medium mb-1">Base Rate</p>
                        <p className="text-2xl font-bold text-violet-600">${rule.baseRate}</p>
                      </div>
                    )}
                    
                    {rule.minimumGuarantee && (
                      <div>
                        <p className="text-sm font-medium mb-1">Minimum Guarantee</p>
                        <p className="text-2xl font-bold text-purple-600">${rule.minimumGuarantee}</p>
                      </div>
                    )}
                    
                    {rule.volumeTiers?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Volume Tiers</p>
                        <p className="text-sm text-muted-foreground">{rule.volumeTiers.length} tier(s) configured</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Royalty Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Rule Dialog - Placeholder for now */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ruleToEdit?.id ? "Edit Rule" : "Add New Rule"}</DialogTitle>
            <DialogDescription>
              Configure the royalty rule parameters below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              Advanced rule editing coming soon! For now, you can activate/deactivate rules above.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
