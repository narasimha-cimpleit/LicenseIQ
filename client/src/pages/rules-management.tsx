import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash2, Check, X, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
  
  // Track which rule is being edited (null = none, 'new' = adding new rule, or rule.id)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [editForm, setEditForm] = useState({
    ruleName: "",
    description: "",
    ruleType: "tiered_pricing",
    productCategories: [] as string[],
    territories: [] as string[],
    containerSizes: [] as string[],
    baseRate: "",
    minimumGuarantee: "",
    volumeTiers: [] as Array<{ min: number; max: number | null; rate: number }>,
    seasonalAdjustments: {} as Record<string, number>,
    territoryPremiums: {} as Record<string, number>,
    priority: 1,
  });
  
  // Temporary input states for arrays
  const [newCategory, setNewCategory] = useState("");
  const [newTerritory, setNewTerritory] = useState("");
  const [newContainerSize, setNewContainerSize] = useState("");
  
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
  
  // Save/Update rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      if (editingRuleId && editingRuleId !== 'new') {
        // Update existing rule
        return apiRequest(`/api/contracts/${id}/rules/${editingRuleId}`, {
          method: "PATCH",
          body: JSON.stringify(ruleData),
        });
      } else {
        // Create new rule
        return apiRequest(`/api/contracts/${id}/rules`, {
          method: "POST",
          body: JSON.stringify({ ...ruleData, contractId: id }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}/rules`] });
      toast({
        title: "Rule saved",
        description: "The royalty rule has been saved successfully.",
      });
      setEditingRuleId(null);
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save rule",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEditForm({
      ruleName: "",
      description: "",
      ruleType: "tiered_pricing",
      productCategories: [],
      territories: [],
      containerSizes: [],
      baseRate: "",
      minimumGuarantee: "",
      volumeTiers: [],
      seasonalAdjustments: {},
      territoryPremiums: {},
      priority: 1,
    });
    setNewCategory("");
    setNewTerritory("");
    setNewContainerSize("");
  };

  const startEdit = (rule: RoyaltyRule) => {
    setShowAddForm(false); // Close add form if open
    setEditingRuleId(rule.id);
    setEditForm({
      ruleName: rule.ruleName || "",
      description: rule.description || "",
      ruleType: rule.ruleType || "tiered_pricing",
      productCategories: rule.productCategories || [],
      territories: rule.territories || [],
      containerSizes: rule.containerSizes || [],
      baseRate: rule.baseRate || "",
      minimumGuarantee: rule.minimumGuarantee || "",
      volumeTiers: rule.volumeTiers || [],
      seasonalAdjustments: rule.seasonalAdjustments || {},
      territoryPremiums: rule.territoryPremiums || {},
      priority: rule.priority || 1,
    });
  };

  const cancelEdit = () => {
    setEditingRuleId(null);
    setShowAddForm(false);
    resetForm();
  };

  const handleSaveRule = () => {
    if (!editForm.ruleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Rule name is required",
        variant: "destructive",
      });
      return;
    }
    saveRuleMutation.mutate(editForm);
  };

  const startAddNew = () => {
    setEditingRuleId(null); // Close any open edit form
    resetForm();
    setShowAddForm(true);
    setEditingRuleId('new');
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
  
  // Helper functions for managing form arrays
  const addCategory = () => {
    if (newCategory.trim()) {
      setEditForm({ ...editForm, productCategories: [...editForm.productCategories, newCategory.trim()] });
      setNewCategory("");
    }
  };
  
  const removeCategory = (index: number) => {
    setEditForm({ ...editForm, productCategories: editForm.productCategories.filter((_, i) => i !== index) });
  };
  
  const addTerritory = () => {
    if (newTerritory.trim()) {
      setEditForm({ ...editForm, territories: [...editForm.territories, newTerritory.trim()] });
      setNewTerritory("");
    }
  };
  
  const removeTerritory = (index: number) => {
    setEditForm({ ...editForm, territories: editForm.territories.filter((_, i) => i !== index) });
  };
  
  const addContainerSize = () => {
    if (newContainerSize.trim()) {
      setEditForm({ ...editForm, containerSizes: [...editForm.containerSizes, newContainerSize.trim()] });
      setNewContainerSize("");
    }
  };
  
  const removeContainerSize = (index: number) => {
    setEditForm({ ...editForm, containerSizes: editForm.containerSizes.filter((_, i) => i !== index) });
  };
  
  const addVolumeTier = () => {
    setEditForm({ 
      ...editForm, 
      volumeTiers: [...editForm.volumeTiers, { min: 0, max: null, rate: 0 }] 
    });
  };
  
  const updateVolumeTier = (index: number, field: 'min' | 'max' | 'rate', value: number | null) => {
    const newTiers = [...editForm.volumeTiers];
    newTiers[index][field] = value as any;
    setEditForm({ ...editForm, volumeTiers: newTiers });
  };
  
  const removeVolumeTier = (index: number) => {
    setEditForm({ ...editForm, volumeTiers: editForm.volumeTiers.filter((_, i) => i !== index) });
  };

  // Render edit form component
  const renderEditForm = () => (
    <div className="space-y-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-violet-200 dark:border-violet-800">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="ruleName">Rule Name *</Label>
            <Input
              id="ruleName"
              value={editForm.ruleName}
              onChange={(e) => setEditForm({ ...editForm, ruleName: e.target.value })}
              placeholder="e.g., Tier 1 — Ornamental Trees"
              data-testid="input-rule-name"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Describe this rule..."
              rows={2}
              data-testid="input-rule-description"
            />
          </div>
          
          <div>
            <Label htmlFor="ruleType">Rule Type</Label>
            <Select value={editForm.ruleType} onValueChange={(value) => setEditForm({ ...editForm, ruleType: value })}>
              <SelectTrigger data-testid="select-rule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiered_pricing">Tiered Pricing</SelectItem>
                <SelectItem value="minimum_guarantee">Minimum Guarantee</SelectItem>
                <SelectItem value="seasonal_adjustment">Seasonal Adjustment</SelectItem>
                <SelectItem value="territory_premium">Territory Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority (1 = highest)</Label>
            <Input
              id="priority"
              type="number"
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 1 })}
              data-testid="input-priority"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Rates & Calculations */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Rates & Calculations</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="baseRate">Base Rate ($)</Label>
            <Input
              id="baseRate"
              type="number"
              step="0.01"
              value={editForm.baseRate}
              onChange={(e) => setEditForm({ ...editForm, baseRate: e.target.value })}
              placeholder="1.25"
              data-testid="input-base-rate"
            />
            <p className="text-xs text-muted-foreground mt-1">Per-unit base royalty rate</p>
          </div>
          
          <div>
            <Label htmlFor="minimumGuarantee">Minimum Guarantee ($)</Label>
            <Input
              id="minimumGuarantee"
              type="number"
              step="0.01"
              value={editForm.minimumGuarantee}
              onChange={(e) => setEditForm({ ...editForm, minimumGuarantee: e.target.value })}
              placeholder="85000"
              data-testid="input-minimum-guarantee"
            />
            <p className="text-xs text-muted-foreground mt-1">Annual minimum payment</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Volume Tiers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Volume Tiers</h3>
          <Button type="button" size="sm" onClick={addVolumeTier} data-testid="button-add-volume-tier">
            <Plus className="h-4 w-4 mr-1" />
            Add Tier
          </Button>
        </div>
        {editForm.volumeTiers.map((tier, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 items-end">
            <div>
              <Label>Min Quantity</Label>
              <Input
                type="number"
                value={tier.min}
                onChange={(e) => updateVolumeTier(index, 'min', parseInt(e.target.value) || 0)}
                data-testid={`input-tier-min-${index}`}
              />
            </div>
            <div>
              <Label>Max Quantity</Label>
              <Input
                type="number"
                value={tier.max || ""}
                onChange={(e) => updateVolumeTier(index, 'max', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="∞"
                data-testid={`input-tier-max-${index}`}
              />
            </div>
            <div>
              <Label>Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={tier.rate}
                onChange={(e) => updateVolumeTier(index, 'rate', parseFloat(e.target.value) || 0)}
                data-testid={`input-tier-rate-${index}`}
              />
            </div>
            <Button type="button" variant="destructive" size="icon" onClick={() => removeVolumeTier(index)} data-testid={`button-remove-tier-${index}`}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {editForm.volumeTiers.length === 0 && (
          <p className="text-sm text-muted-foreground">No volume tiers configured. Click "Add Tier" to create one.</p>
        )}
      </div>

      <Separator />

      {/* Seasonal Adjustments */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Seasonal Adjustments (Multipliers)</h3>
        <div className="grid grid-cols-2 gap-4">
          {['Spring', 'Summer', 'Fall', 'Winter', 'Holiday', 'Off-Season'].map((season) => (
            <div key={season}>
              <Label htmlFor={`seasonal-${season}`}>{season}</Label>
              <Input
                id={`seasonal-${season}`}
                type="number"
                step="0.01"
                value={editForm.seasonalAdjustments[season] || ""}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  seasonalAdjustments: { ...editForm.seasonalAdjustments, [season]: parseFloat(e.target.value) || 0 }
                })}
                placeholder="1.0"
                data-testid={`input-seasonal-${season.toLowerCase()}`}
              />
              <p className="text-xs text-muted-foreground mt-1">1.0 = no change, 1.15 = +15%</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Territory Premiums */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Territory Premiums (Multipliers)</h3>
        <div className="grid grid-cols-2 gap-4">
          {['Primary', 'Secondary', 'International', 'Organic', 'Specialty'].map((territory) => (
            <div key={territory}>
              <Label htmlFor={`territory-${territory}`}>{territory}</Label>
              <Input
                id={`territory-${territory}`}
                type="number"
                step="0.01"
                value={editForm.territoryPremiums[territory] || ""}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  territoryPremiums: { ...editForm.territoryPremiums, [territory]: parseFloat(e.target.value) || 0 }
                })}
                placeholder="1.0"
                data-testid={`input-territory-${territory.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Product Categories */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Product Categories</h3>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Add category..."
            data-testid="input-new-category"
          />
          <Button type="button" onClick={addCategory} data-testid="button-add-category">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editForm.productCategories.map((cat, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1" data-testid={`badge-category-${idx}`}>
              {cat}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeCategory(idx)} />
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Territories */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Territories</h3>
        <div className="flex gap-2">
          <Input
            value={newTerritory}
            onChange={(e) => setNewTerritory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTerritory()}
            placeholder="Add territory..."
            data-testid="input-new-territory"
          />
          <Button type="button" onClick={addTerritory} data-testid="button-add-territory">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editForm.territories.map((terr, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1" data-testid={`badge-territory-${idx}`}>
              {terr}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTerritory(idx)} />
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Container Sizes */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Container Sizes</h3>
        <div className="flex gap-2">
          <Input
            value={newContainerSize}
            onChange={(e) => setNewContainerSize(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addContainerSize()}
            placeholder="Add container size..."
            data-testid="input-new-container-size"
          />
          <Button type="button" onClick={addContainerSize} data-testid="button-add-container-size">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editForm.containerSizes.map((size, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1" data-testid={`badge-container-size-${idx}`}>
              {size}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeContainerSize(idx)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={cancelEdit} data-testid="button-cancel-edit">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={handleSaveRule} 
          disabled={saveRuleMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
          data-testid="button-save-rule"
        >
          <Check className="h-4 w-4 mr-2" />
          {saveRuleMutation.isPending ? "Saving..." : "Save Rule"}
        </Button>
      </div>
    </div>
  );

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
            {!showAddForm && (
              <Button
                onClick={startAddNew}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
                data-testid="button-add-rule"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Rule
              </Button>
            )}
          </div>
        </div>

        {/* Add New Rule Form (Inline) */}
        {showAddForm && (
          <Card className="mb-6 border-2 border-violet-300 dark:border-violet-700">
            <CardHeader>
              <CardTitle>Add New Royalty Rule</CardTitle>
              <CardDescription>
                Configure calculation formulas and rule parameters. All fields are optional except Rule Name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderEditForm()}
            </CardContent>
          </Card>
        )}

        {/* Rules List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading rules...</p>
          </div>
        ) : !rulesData?.rules || rulesData.rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No royalty rules found for this contract.</p>
              {!showAddForm && (
                <Button
                  onClick={startAddNew}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Rule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rulesData.rules.map((rule) => (
              <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""} data-testid={`card-rule-${rule.id}`}>
                {editingRuleId === rule.id ? (
                  // Inline Edit Mode
                  <CardContent className="pt-6">
                    {renderEditForm()}
                  </CardContent>
                ) : (
                  // View Mode
                  <>
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
                            onClick={() => startEdit(rule)}
                            data-testid={`button-edit-${rule.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
                                deleteMutation.mutate(rule.id);
                              }
                            }}
                            data-testid={`button-delete-${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Calculation Formula Display */}
                      {(() => {
                        const hasSeasonalAdj = rule.seasonalAdjustments && Object.keys(rule.seasonalAdjustments).length > 0;
                        const hasTerritoryPrem = rule.territoryPremiums && Object.keys(rule.territoryPremiums).length > 0;
                        let calculationFormula = '';
                        
                        if (rule.volumeTiers && rule.volumeTiers.length > 0) {
                          // Volume-based tiered pricing formula
                          let formulaParts: string[] = [];
                          rule.volumeTiers.forEach((tier: any, idx: number) => {
                            const condition = tier.max 
                              ? `if (quantity >= ${tier.min.toLocaleString()} && quantity <= ${tier.max.toLocaleString()})` 
                              : `if (quantity >= ${tier.min.toLocaleString()})`;
                            
                            let rateStr = typeof tier.rate === 'number' 
                              ? `$${tier.rate.toFixed(2)}`
                              : 'rate';
                            
                            let formula = `  royalty = quantity × ${rateStr}`;
                            if (hasSeasonalAdj) formula += ' × seasonalMultiplier';
                            if (hasTerritoryPrem) formula += ' × territoryMultiplier';
                            
                            formulaParts.push(`${condition} {\n${formula}\n}`);
                          });
                          calculationFormula = formulaParts.join(' else ');
                        } else if (rule.baseRate) {
                          // Simple base rate formula
                          let rateStr = `$${parseFloat(rule.baseRate).toFixed(2)}`;
                          
                          calculationFormula = `royalty = quantity × ${rateStr}`;
                          if (hasSeasonalAdj) calculationFormula += ' × seasonalMultiplier';
                          if (hasTerritoryPrem) calculationFormula += ' × territoryMultiplier';
                        } else if (rule.ruleType === 'minimum_guarantee' && rule.minimumGuarantee) {
                          calculationFormula = `royalty = max(calculated_royalty, $${parseFloat(rule.minimumGuarantee).toFixed(2)})`;
                        }
                        
                        return calculationFormula ? (
                          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-950 rounded border border-blue-300 dark:border-blue-700">
                            <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              💡 Calculation Formula:
                            </div>
                            <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-mono">
                              {calculationFormula}
                            </pre>
                          </div>
                        ) : null;
                      })()}
                      
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
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
