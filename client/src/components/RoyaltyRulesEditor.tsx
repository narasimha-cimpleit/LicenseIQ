import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Edit, Plus, Trash2, Play, DollarSign, Percent, TrendingUp, RefreshCw, Sparkles, ChevronDown, ChevronUp, Save, X, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RoyaltyRule {
  id: string;
  ruleName: string;
  ruleType: 'percentage' | 'tiered' | 'minimum_guarantee' | 'cap' | 'deduction' | 'fixed_fee';
  description: string;
  conditions: {
    productCategories?: string[];
    territories?: string[];
    salesVolumeMin?: number;
    salesVolumeMax?: number;
    timeperiod?: 'monthly' | 'quarterly' | 'annually' | 'one-time';
    currency?: string;
  };
  calculation: {
    rate?: number;
    tiers?: Array<{ min: number; max?: number; rate: number }>;
    amount?: number;
    formula?: string;
    baseField?: 'grossRevenue' | 'netRevenue' | 'units' | 'custom';
  };
  priority: number;
  isActive: boolean;
  confidence: number;
}

interface RuleSet {
  id: string;
  licenseType: string;
  licensor: string;
  licensee: string;
  rules: RoyaltyRule[];
  currency: string;
  effectiveDate?: string;
  expirationDate?: string;
  status: string;
  confidence: number;
  rulesCount: number;
}

interface RoyaltyCalculationInput {
  grossRevenue?: number;
  netRevenue?: number;
  units?: number;
  territory?: string;
  productCategory?: string;
  timeframe?: 'monthly' | 'quarterly' | 'annually';
  customFields?: Record<string, number | string>;
}

interface RoyaltyRulesEditorProps {
  contractId: string;
  ruleSets: RuleSet[];
  onRulesUpdate: () => void;
}

const RULE_TYPE_LABELS = {
  percentage: "Percentage",
  tiered: "Tiered Rate",
  minimum_guarantee: "Minimum Guarantee",
  cap: "Maximum Cap",
  deduction: "Deduction",
  fixed_fee: "Fixed Fee"
};

const RULE_TYPE_ICONS = {
  percentage: Percent,
  tiered: TrendingUp,
  minimum_guarantee: DollarSign,
  cap: DollarSign,
  deduction: DollarSign,
  fixed_fee: DollarSign
};

export function RoyaltyRulesEditor({ contractId, ruleSets, onRulesUpdate }: RoyaltyRulesEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState<string | null>(null);
  const [localEditRule, setLocalEditRule] = useState<RoyaltyRule | null>(null);
  const [calculationInput, setCalculationInput] = useState<RoyaltyCalculationInput>({
    grossRevenue: 0,
    netRevenue: 0,
    territory: 'US',
    timeframe: 'monthly'
  });
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [royaltyDemoResult, setRoyaltyDemoResult] = useState<any>(null);
  const [showRoyaltyDemo, setShowRoyaltyDemo] = useState(false);

  // Mutation for updating a rule
  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleSetId, ruleIndex, updatedRule }: { 
      ruleSetId: string; 
      ruleIndex: number; 
      updatedRule: RoyaltyRule;
    }) => {
      return apiRequest('PUT', `/api/contracts/${contractId}/rules/${ruleSetId}/rule/${ruleIndex}`, updatedRule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId, 'rules'] });
      onRulesUpdate();
      setEditingRuleId(null);
      setLocalEditRule(null);
      toast({ description: "Rule updated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to update rule" });
    }
  });

  // Mutation for adding a new rule
  const addRuleMutation = useMutation({
    mutationFn: async ({ ruleSetId, newRule }: { ruleSetId: string; newRule: Partial<RoyaltyRule> }) => {
      return apiRequest('POST', `/api/contracts/${contractId}/rules/${ruleSetId}/rule`, newRule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId, 'rules'] });
      onRulesUpdate();
      setIsAddingRule(null);
      toast({ description: "Rule added successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to add rule" });
    }
  });

  // Mutation for deleting a rule
  const deleteRuleMutation = useMutation({
    mutationFn: async ({ ruleSetId, ruleIndex }: { ruleSetId: string; ruleIndex: number }) => {
      return apiRequest('DELETE', `/api/contracts/${contractId}/rules/${ruleSetId}/rule/${ruleIndex}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId, 'rules'] });
      onRulesUpdate();
      toast({ description: "Rule deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to delete rule" });
    }
  });

  // Mutation for calculating royalties
  const calculateRoyaltiesMutation = useMutation({
    mutationFn: async (input: RoyaltyCalculationInput) => {
      return apiRequest('POST', `/api/contracts/${contractId}/calculate-royalties`, input);
    },
    onSuccess: (result) => {
      setCalculationResult(result);
      setShowCalculation(true);
      toast({ description: "Royalties calculated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", description: error.message || "Failed to calculate royalties" });
    }
  });

  // Sample Sales Data for Demo
  const sampleSalesData = [
    {
      variety: "Aurora Flame Maple",
      size: "1-gallon",
      units: 6200,
      unitPrice: 24.99,
      season: "Spring",
      territory: "Primary",
      organic: false,
      tier: 1,
      baseRate: 1.25,
      discountThreshold: 5000,
      discountRate: 1.10
    },
    {
      variety: "Aurora Flame Maple", 
      size: "5-gallon",
      units: 1100,
      unitPrice: 89.99,
      season: "Off-Season",
      territory: "Primary",
      organic: false,
      tier: 1,
      baseRate: 4.50,
      discountThreshold: 1000,
      discountRate: 3.95
    },
    {
      variety: "Golden Spire Juniper",
      size: "3-gallon",
      units: 1800,
      unitPrice: 54.99,
      season: "Fall",
      territory: "Secondary",
      organic: false,
      tier: 1,
      baseRate: 2.85,
      discountThreshold: 2000,
      territoryPremium: 0.10
    },
    {
      variety: "Pacific Sunset Rose",
      size: "6-inch",
      units: 3000,
      unitPrice: 18.99,
      season: "Spring",
      territory: "Primary",
      organic: false,
      tier: 2,
      baseRate: 1.15,
      multiplier: 1.2,
      springAdjustment: 0.10
    },
    {
      variety: "Emerald Crown Hosta",
      size: "2-gallon+",
      units: 900,
      unitPrice: 39.99,
      season: "Fall",
      territory: "Primary",
      organic: true,
      tier: 2,
      baseRate: 3.25,
      multiplier: 1.5,
      fallAdjustment: -0.05,
      organicPremium: 0.25
    },
    {
      variety: "Cascade Blue Hydrangea",
      size: "Mixed",
      units: 20000,
      unitPrice: 32.99,
      season: "Spring + Off-Season",
      territory: "Primary",
      organic: false,
      tier: 3,
      slidingRate: 1.45,
      minimumAnnual: 25000
    },
    {
      variety: "Pacific Sunset Rose",
      size: "1-gallon", 
      units: 250,
      unitPrice: 24.99,
      season: "Holiday",
      territory: "Primary",
      organic: false,
      tier: 2,
      baseRate: 1.85,
      multiplier: 1.3,
      holidayAdjustment: 0.20
    }
  ];

  const calculateSampleRoyalties = () => {
    const results = sampleSalesData.map(item => {
      let royaltyPerUnit = 0;
      let appliedRules = [];

      if (item.tier === 1) {
        // Tier 1: Ornamental Trees & Shrubs
        if (item.units >= (item.discountThreshold || 0) && item.discountRate !== undefined) {
          royaltyPerUnit = item.discountRate;
          appliedRules.push(`Volume discount: ${item.units} units ≥ ${item.discountThreshold} threshold`);
        } else {
          royaltyPerUnit = item.baseRate || 0;
          appliedRules.push(`Base rate: ${item.baseRate}/unit`);
        }

        // Territory premium
        if (item.territoryPremium && item.territory === "Secondary") {
          royaltyPerUnit *= (1 + item.territoryPremium);
          appliedRules.push(`Secondary territory: +${(item.territoryPremium * 100)}% premium`);
        }
      } 
      else if (item.tier === 2) {
        // Tier 2: Perennials & Roses
        royaltyPerUnit = (item.baseRate || 0) * (item.multiplier || 1);
        appliedRules.push(`Base: $${item.baseRate} × ${item.multiplier} multiplier`);

        // Seasonal adjustments
        if (item.springAdjustment && item.season === "Spring") {
          royaltyPerUnit *= (1 + item.springAdjustment);
          appliedRules.push(`Spring: +${(item.springAdjustment * 100)}% adjustment`);
        }
        if (item.fallAdjustment && item.season === "Fall") {
          royaltyPerUnit *= (1 + item.fallAdjustment);
          appliedRules.push(`Fall: ${(item.fallAdjustment * 100)}% adjustment`);
        }
        if (item.holidayAdjustment && item.season === "Holiday") {
          royaltyPerUnit *= (1 + item.holidayAdjustment);
          appliedRules.push(`Holiday: +${(item.holidayAdjustment * 100)}% adjustment`);
        }

        // Organic premium
        if (item.organic && item.organicPremium) {
          royaltyPerUnit *= (1 + item.organicPremium);
          appliedRules.push(`Organic: +${(item.organicPremium * 100)}% premium`);
        }
      }
      else if (item.tier === 3) {
        // Tier 3: Sliding scale
        royaltyPerUnit = item.slidingRate || 0;
        appliedRules.push(`Sliding scale: ${item.units} units → $${item.slidingRate}/unit`);
      }

      const royaltyTotal = item.units * royaltyPerUnit;

      return {
        ...item,
        royaltyPerUnit: parseFloat(royaltyPerUnit.toFixed(3)),
        royaltyTotal: parseFloat(royaltyTotal.toFixed(2)),
        appliedRules
      };
    });

    const totalRoyalties = results.reduce((sum, item) => sum + item.royaltyTotal, 0);
    const minimumGuarantee = 85000;
    const finalPayable = Math.max(totalRoyalties, minimumGuarantee);
    const shortfall = minimumGuarantee > totalRoyalties ? minimumGuarantee - totalRoyalties : 0;

    setRoyaltyDemoResult({
      calculations: results,
      summary: {
        totalCalculated: parseFloat(totalRoyalties.toFixed(2)),
        minimumGuarantee,
        shortfall: parseFloat(shortfall.toFixed(2)),
        finalPayable: parseFloat(finalPayable.toFixed(2))
      }
    });
    
    setShowRoyaltyDemo(true);
    toast({ 
      description: `Royalty calculation complete! Total: $${finalPayable.toLocaleString()}` 
    });
  };

  const renderRuleEditor = (rule: RoyaltyRule, onSave: (updatedRule: RoyaltyRule) => void) => {
    // Use parent component's state instead of local useState
    const currentRule = localEditRule || rule;

    return (
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name" className="text-sm font-medium">Rule Name</Label>
              <Input
                id="rule-name"
                value={currentRule.ruleName}
                onChange={(e) => setLocalEditRule(prev => ({ ...(prev || rule), ruleName: e.target.value }))}
                placeholder="Enter rule name"
                className="h-10"
                data-testid="input-rule-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-type" className="text-sm font-medium">Rule Type</Label>
              <Select
                value={currentRule.ruleType}
                onValueChange={(value: any) => setLocalEditRule(prev => ({ ...(prev || rule), ruleType: value }))}
              >
                <SelectTrigger id="rule-type" className="h-10" data-testid="select-rule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RULE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={currentRule.description}
              onChange={(e) => setLocalEditRule(prev => ({ ...(prev || rule), description: e.target.value }))}
              placeholder="Describe when and how this rule applies"
              className="min-h-[80px] resize-none"
              data-testid="input-rule-description"
            />
          </div>
        </div>

        {/* Calculation Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Calculation Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRule.ruleType === 'percentage' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-sm font-medium">Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={currentRule.calculation.rate || ''}
                    onChange={(e) => setLocalEditRule(prev => ({
                      ...(prev || rule),
                      calculation: { ...(prev || rule).calculation, rate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="Enter percentage rate"
                    className="h-10"
                    data-testid="input-rule-rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base-field" className="text-sm font-medium">Base Field</Label>
                  <Select
                    value={currentRule.calculation.baseField || 'netRevenue'}
                    onValueChange={(value: any) => setLocalEditRule(prev => ({
                      ...(prev || rule),
                      calculation: { ...(prev || rule).calculation, baseField: value }
                    }))}
                  >
                    <SelectTrigger id="base-field" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grossRevenue">Gross Revenue</SelectItem>
                      <SelectItem value="netRevenue">Net Revenue</SelectItem>
                      <SelectItem value="units">Units Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {(currentRule.ruleType === 'fixed_fee' || currentRule.ruleType === 'minimum_guarantee' || currentRule.ruleType === 'cap') && (
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentRule.calculation.amount || ''}
                  onChange={(e) => setLocalEditRule(prev => ({
                    ...(prev || rule),
                    calculation: { ...(prev || rule).calculation, amount: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="Enter amount in dollars"
                  className="h-10"
                  data-testid="input-rule-amount"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority (1-100)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={currentRule.priority}
                onChange={(e) => setLocalEditRule(prev => ({ ...(prev || rule), priority: parseInt(e.target.value) || 10 }))}
                placeholder="Enter priority level"
                className="h-10"
                data-testid="input-rule-priority"
              />
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Conditions (When Rule Applies)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-volume" className="text-sm font-medium">Min Volume</Label>
              <Input
                id="min-volume"
                type="number"
                step="0.01"
                min="0"
                value={currentRule.conditions.salesVolumeMin || ''}
                onChange={(e) => setLocalEditRule(prev => ({
                  ...(prev || rule),
                  conditions: { ...(prev || rule).conditions, salesVolumeMin: parseFloat(e.target.value) || undefined }
                }))}
                placeholder="Optional minimum (leave empty for no minimum)"
                className="h-10"
                data-testid="input-rule-min-volume"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-volume" className="text-sm font-medium">Max Volume</Label>
              <Input
                id="max-volume"
                type="number"
                step="0.01"
                min="0"
                value={currentRule.conditions.salesVolumeMax || ''}
                onChange={(e) => setLocalEditRule(prev => ({
                  ...(prev || rule),
                  conditions: { ...(prev || rule).conditions, salesVolumeMax: parseFloat(e.target.value) || undefined }
                }))}
                placeholder="Optional maximum (leave empty for no maximum)"
                className="h-10"
                data-testid="input-rule-max-volume"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => { setEditingRuleId(null); setLocalEditRule(null); }} data-testid="button-cancel-edit">Cancel</Button>
          <Button
            onClick={() => onSave(currentRule)}
            disabled={updateRuleMutation.isPending}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-save-rule"
          >
            {updateRuleMutation.isPending ? 'Saving...' : 'Save Rule'}
          </Button>
        </div>
      </div>
    );
  };

  const renderRule = (rule: RoyaltyRule, ruleIndex: number, ruleSetId: string) => {
    const RuleIcon = RULE_TYPE_ICONS[rule.ruleType];
    const isEditing = editingRuleId === `${ruleSetId}-${ruleIndex}`;
    
    return (
      <Collapsible key={rule.id || ruleIndex} open={isEditing} onOpenChange={(open) => {
        if (open) {
          setEditingRuleId(`${ruleSetId}-${ruleIndex}`);
          setLocalEditRule(rule);
        } else {
          setEditingRuleId(null);
          setLocalEditRule(null);
        }
      }}>
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <RuleIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm" data-testid={`rule-name-${ruleIndex}`}>
                {rule.ruleName || rule.description || 'Unnamed Rule'}
              </span>
              <Badge variant="outline" className="text-xs">
                {RULE_TYPE_LABELS[rule.ruleType]}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                Priority {rule.priority}
              </Badge>
              <Badge variant={rule.confidence > 0.8 ? "default" : "secondary"} className="text-xs">
                {Math.round(rule.confidence * 100)}%
              </Badge>
            </div>
          </div>

          {!isEditing && (
            <>
              <p className="text-sm text-muted-foreground mb-3" data-testid={`rule-description-${ruleIndex}`}>
                {rule.description || 'No description provided'}
              </p>

              {/* Rule Details */}
              <div className="space-y-2 text-xs">
                {rule.ruleType === 'percentage' && rule.calculation.rate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">{rule.calculation.rate}% of {rule.calculation.baseField || 'net revenue'}</span>
                  </div>
                )}
                
                {(rule.ruleType === 'fixed_fee' || rule.ruleType === 'minimum_guarantee' || rule.ruleType === 'cap') && rule.calculation.amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">${rule.calculation.amount.toLocaleString()}</span>
                  </div>
                )}

                {(rule.conditions.salesVolumeMin || rule.conditions.salesVolumeMax) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume Range:</span>
                    <span className="font-medium">
                      {rule.conditions.salesVolumeMin ? `$${rule.conditions.salesVolumeMin.toLocaleString()}` : '0'} - {rule.conditions.salesVolumeMax ? `$${rule.conditions.salesVolumeMax.toLocaleString()}` : '∞'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <CollapsibleTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid={`button-edit-rule-${ruleIndex}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </CollapsibleTrigger>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteRuleMutation.mutate({ ruleSetId, ruleIndex })}
                  disabled={deleteRuleMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                  data-testid={`button-delete-rule-${ruleIndex}`}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </>
          )}

          {/* Inline Editor - NO MORE FRUSTRATING DIALOGS! */}
          <CollapsibleContent>
            <div className="pt-4 border-t mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Edit className="h-4 w-4 text-blue-600" />
                  Editing Rule - {rule.ruleName || 'Unnamed Rule'}
                </h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              {renderRuleEditor(rule, (updatedRule) => 
                updateRuleMutation.mutate({
                  ruleSetId,
                  ruleIndex,
                  updatedRule
                })
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Extracted Royalty Rules</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered calculation rules from your contract
                  </p>
                </div>
              </div>
              {ruleSets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {ruleSets.reduce((acc, set) => acc + (set.rules?.length || 0), 0)} Rules Found
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {ruleSets.length} Rule Set{ruleSets.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCalculation(!showCalculation)}
                variant="outline"
                className="flex items-center gap-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                data-testid="button-toggle-calculator"
              >
                <Calculator className="h-4 w-4" />
                {showCalculation ? 'Hide Calculator' : 'Show Calculator'}
              </Button>
              
              <Button
                onClick={() => calculateSampleRoyalties()}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                data-testid="button-calculate-royalty"
              >
                <DollarSign className="h-4 w-4" />
                Calculate Royalty Demo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Royalty Calculator */}
      {showCalculation && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-300">
              <Play className="h-4 w-4" />
              Royalty Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Gross Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={calculationInput.grossRevenue || ''}
                  onChange={(e) => setCalculationInput(prev => ({
                    ...prev,
                    grossRevenue: parseFloat(e.target.value) || 0
                  }))}
                  data-testid="input-gross-revenue"
                />
              </div>
              <div>
                <Label>Net Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={calculationInput.netRevenue || ''}
                  onChange={(e) => setCalculationInput(prev => ({
                    ...prev,
                    netRevenue: parseFloat(e.target.value) || 0
                  }))}
                  data-testid="input-net-revenue"
                />
              </div>
              <div>
                <Label>Territory</Label>
                <Select
                  value={calculationInput.territory || 'US'}
                  onValueChange={(value) => setCalculationInput(prev => ({ ...prev, territory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="EU">European Union</SelectItem>
                    <SelectItem value="APAC">Asia Pacific</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timeframe</Label>
                <Select
                  value={calculationInput.timeframe || 'monthly'}
                  onValueChange={(value: any) => setCalculationInput(prev => ({ ...prev, timeframe: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => calculateRoyaltiesMutation.mutate(calculationInput)}
                disabled={calculateRoyaltiesMutation.isPending || (!calculationInput.grossRevenue && !calculationInput.netRevenue)}
                data-testid="button-calculate-royalties"
              >
                {calculateRoyaltiesMutation.isPending ? 'Calculating...' : 'Calculate Royalties'}
              </Button>
            </div>

            {calculationResult && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Calculation Result</h4>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ${calculationResult.totalRoyalty?.toLocaleString() || '0'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rules Applied:</span>
                    <span>{calculationResult.metadata?.rulesApplied || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span>{calculationResult.currency || 'USD'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calculated At:</span>
                    <span>{new Date(calculationResult.calculatedAt).toLocaleString()}</span>
                  </div>
                </div>

                {calculationResult.breakdown && calculationResult.breakdown.length > 0 && (
                  <div className="mt-3">
                    <Separator />
                    <div className="mt-3">
                      <h5 className="text-xs font-medium mb-2">Breakdown by Rule:</h5>
                      <div className="space-y-1">
                        {calculationResult.breakdown.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className={item.applied ? 'text-foreground' : 'text-muted-foreground'}>
                              {item.ruleName}
                            </span>
                            <span className={item.applied ? 'font-medium' : 'text-muted-foreground'}>
                              {item.applied ? `$${item.amount.toLocaleString()}` : 'Not applied'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Royalty Demo Results Display */}
      {showRoyaltyDemo && royaltyDemoResult && (
        <div className="space-y-6 p-6 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950/30 dark:via-blue-950/30 dark:to-purple-950/30 rounded-xl border-2 border-emerald-200 shadow-xl">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  🌟 Calculate Royalty Demo Results
                </h2>
                <p className="text-muted-foreground">
                  Advanced AI-powered calculation engine with realistic plant nursery contract data
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRoyaltyDemo(false)}
              className="hover:bg-red-100 dark:hover:bg-red-950"
              data-testid="button-close-demo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sample Data Overview */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <TrendingUp className="h-5 w-5" />
                🌱 Realistic Sample Data (7 Plant Varieties)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Premium Varieties:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>🍁 <strong>Aurora Flame Maple</strong> (1-gal & 5-gal) - Volume discounts</li>
                    <li>🌲 <strong>Golden Spire Juniper</strong> - Territory premiums</li>
                    <li>🌹 <strong>Pacific Sunset Rose</strong> (6-inch & 1-gal) - Seasonal adjustments</li>
                    <li>🌿 <strong>Emerald Crown Hosta</strong> - Organic premiums (+25%)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Special Collections:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>🌸 <strong>Cascade Blue Hydrangea</strong> - Sliding scale pricing</li>
                    <li>🌺 <strong>Royal Purple Clematis</strong> - High-value specialty</li>
                    <li>🌱 <strong>Heritage Oak Collection</strong> - Premium licensing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Engine Overview */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calculator className="h-5 w-5" />
                ⚡ Advanced Calculation Engine (3-Tier System)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">🎯 Tier 1: Base Rules</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Volume discounts</li>
                    <li>• Territory premiums (+10%)</li>
                    <li>• Base royalty rates</li>
                  </ul>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">📅 Tier 2: Seasonal</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Spring: +10% bonus</li>
                    <li>• Fall: -5% adjustment</li>
                    <li>• Holiday: +20% premium</li>
                  </ul>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 mb-2">🌿 Tier 3: Premium</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Organic: +25% bonus</li>
                    <li>• Sliding scale rates</li>
                    <li>• High-volume tiers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary - Large Numbers */}
          <Card className="border-emerald-300 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-950/30 dark:to-green-950/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <DollarSign className="h-6 w-6" />
                💰 Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    ${royaltyDemoResult.summary.totalCalculated.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Calculated Royalties</div>
                  <div className="text-xs text-muted-foreground mt-1">Based on actual sales</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ${royaltyDemoResult.summary.minimumGuarantee.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Minimum Guarantee</div>
                  <div className="text-xs text-muted-foreground mt-1">Contract requirement</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    ${royaltyDemoResult.summary.shortfall.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Shortfall</div>
                  <div className="text-xs text-muted-foreground mt-1">Must be covered</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
                  <div className="text-3xl font-bold mb-1">
                    ${royaltyDemoResult.summary.finalPayable.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium">Final Payable</div>
                  <div className="text-xs opacity-90 mt-1">Total due to licensor</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Calculations with Rich Formatting */}
          <Card className="border-gray-200 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📊 Detailed Calculations by Plant Variety
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Each calculation shows applied rules, seasonal adjustments, and final royalty amounts
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {royaltyDemoResult.calculations.map((calc: any, index: number) => (
                  <div key={index} className="relative p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                    
                    {/* Variety Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                          {calc.variety}
                          {calc.organic && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🌱 Organic</span>}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            📏 <strong>{calc.size}</strong>
                          </span>
                          <span className="text-sm text-muted-foreground">
                            📦 <strong>{calc.units.toLocaleString()} units</strong>
                          </span>
                          <span className="text-sm text-muted-foreground">
                            📅 <strong>{calc.season}</strong>
                          </span>
                          <span className="text-sm text-muted-foreground">
                            🌍 <strong>{calc.territory}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">
                          ${calc.royaltyTotal.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${calc.royaltyPerUnit.toFixed(2)}/unit
                        </div>
                      </div>
                    </div>
                    
                    {/* Applied Rules */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Applied Rules:</h5>
                      <div className="grid gap-1">
                        {calc.appliedRules.map((rule: string, ruleIndex: number) => (
                          <div key={ruleIndex} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-muted-foreground">{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Minimum Guarantee Explanation */}
          <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                    🛡️ Contract Protection: Minimum Guarantee Logic
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">How the Minimum Guarantee Works:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Calculated Royalties:</span>
                      <span className="font-medium">${royaltyDemoResult.summary.totalCalculated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Contract Minimum Guarantee:</span>
                      <span className="font-medium text-blue-600">${royaltyDemoResult.summary.minimumGuarantee.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-medium text-gray-800 dark:text-gray-200">Final Amount Due:</span>
                      <span className="font-bold text-xl text-purple-600">
                        ${Math.max(royaltyDemoResult.summary.totalCalculated, royaltyDemoResult.summary.minimumGuarantee).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Contract Enforcement:</strong> Even though actual sales generated ${royaltyDemoResult.summary.totalCalculated.toLocaleString()} in royalties, 
                    the licensing agreement requires a minimum payment of ${royaltyDemoResult.summary.minimumGuarantee.toLocaleString()}, 
                    ensuring the licensor receives guaranteed compensation regardless of sales performance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Rules Display */}
      {ruleSets.length > 0 ? (
        <div className="space-y-4">
          {ruleSets.map((ruleSet, ruleSetIndex) => (
            <Card key={ruleSet.id} className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100" data-testid={`ruleset-name-${ruleSetIndex}`}>
                      {ruleSet.licenseType} License Rules
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Licensor:</strong> {ruleSet.licensor} | <strong>Licensee:</strong> {ruleSet.licensee}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-purple-700 border-purple-300 dark:text-purple-300">
                      {ruleSet.rulesCount} Rules
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingRule(ruleSet.id)}
                      data-testid={`button-add-rule-${ruleSetIndex}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Rule
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ruleSet.rules && ruleSet.rules.length > 0 ? (
                  <div className="grid gap-3">
                    {ruleSet.rules.map((rule, ruleIndex) => renderRule(rule, ruleIndex, ruleSet.id))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No calculation rules found in this set.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingRule(ruleSet.id)}
                      className="mt-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add First Rule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 border-2 border-dashed border-muted bg-gradient-to-br from-background to-muted/20">
          <CardContent className="space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">No Royalty Rules Found</h3>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Our AI couldn't extract royalty calculation rules from this contract. The document may not contain 
                licensing terms, or the rules might be in a complex format that requires manual review.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                data-testid="button-reprocess-contract"
              >
                <RefreshCw className="h-4 w-4" />
                Reprocess Contract
              </Button>
              <Button 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => setIsAddingRule(Object.keys(ruleSets).length > 0 ? Object.keys(ruleSets)[0] : 'manual')}
                data-testid="button-add-first-rule"
              >
                <Plus className="h-4 w-4" />
                Add First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No more frustrating dialogs! Inline editing now happens within rule cards */}
    </div>
  );
}