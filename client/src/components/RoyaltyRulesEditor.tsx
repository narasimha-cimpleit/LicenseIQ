import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Edit, Plus, Trash2, Play, DollarSign, Percent, TrendingUp, RefreshCw, Sparkles } from "lucide-react";
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
  
  const [editingRule, setEditingRule] = useState<{ ruleSetId: string; ruleIndex: number; rule: RoyaltyRule } | null>(null);
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

  // Mutation for updating a rule
  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleSetId, ruleIndex, updatedRule }: { 
      ruleSetId: string; 
      ruleIndex: number; 
      updatedRule: RoyaltyRule;
    }) => {
      return apiRequest(`/api/contracts/${contractId}/rules/${ruleSetId}/rule/${ruleIndex}`, {
        method: 'PUT',
        body: JSON.stringify(updatedRule),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contractId, 'rules'] });
      onRulesUpdate();
      setEditingRule(null);
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
      return apiRequest(`/api/contracts/${contractId}/rules/${ruleSetId}/rule`, {
        method: 'POST',
        body: JSON.stringify(newRule),
      });
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
      return apiRequest(`/api/contracts/${contractId}/rules/${ruleSetId}/rule/${ruleIndex}`, {
        method: 'DELETE',
      });
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
      return apiRequest(`/api/contracts/${contractId}/calculate-royalties`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
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

  const renderRuleEditor = (rule: RoyaltyRule, onSave: (updatedRule: RoyaltyRule) => void) => {
    // Use parent component's state instead of local useState
    const currentRule = localEditRule || rule;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Rule Name</Label>
            <Input
              value={currentRule.ruleName}
              onChange={(e) => setLocalEditRule(prev => ({ ...(prev || rule), ruleName: e.target.value }))}
              placeholder="Enter rule name"
              data-testid="input-rule-name"
            />
          </div>
          <div>
            <Label>Rule Type</Label>
            <Select
              value={currentRule.ruleType}
              onValueChange={(value: any) => setLocalEditRule(prev => ({ ...(prev || rule), ruleType: value }))}
            >
              <SelectTrigger data-testid="select-rule-type">
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

        <div>
          <Label>Description</Label>
          <Textarea
            value={currentRule.description}
            onChange={(e) => setLocalEditRule(prev => ({ ...(prev || rule), description: e.target.value }))}
            placeholder="Describe when and how this rule applies"
            data-testid="input-rule-description"
          />
        </div>

        {/* Calculation Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Calculation Settings</Label>
          <div className="grid grid-cols-3 gap-3">
            {currentRule.ruleType === 'percentage' && (
              <>
                <div>
                  <Label className="text-xs">Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentRule.calculation.rate || ''}
                    onChange={(e) => setLocalEditRule(prev => ({
                      ...(prev || rule),
                      calculation: { ...(prev || rule).calculation, rate: parseFloat(e.target.value) || 0 }
                    }))}
                    data-testid="input-rule-rate"
                  />
                </div>
                <div>
                  <Label className="text-xs">Base Field</Label>
                  <Select
                    value={currentRule.calculation.baseField || 'netRevenue'}
                    onValueChange={(value: any) => setLocalEditRule(prev => ({
                      ...(prev || rule),
                      calculation: { ...(prev || rule).calculation, baseField: value }
                    }))}
                  >
                    <SelectTrigger>
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
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentRule.calculation.amount || ''}
                  onChange={(e) => setLocalEditRule(prev => ({
                    ...(prev || rule),
                    calculation: { ...(prev || rule).calculation, amount: parseFloat(e.target.value) || 0 }
                  }))}
                  data-testid="input-rule-amount"
                />
              </div>
            )}
            
            <div>
              <Label className="text-xs">Priority (1-100)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={currentRule.priority}
                onChange={(e) => setLocalEditRule(prev => ({ ...(prev || rule), priority: parseInt(e.target.value) || 10 }))}
                data-testid="input-rule-priority"
              />
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Conditions (When Rule Applies)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Min Volume</Label>
              <Input
                type="number"
                step="0.01"
                value={currentRule.conditions.salesVolumeMin || ''}
                onChange={(e) => setLocalEditRule(prev => ({
                  ...(prev || rule),
                  conditions: { ...(prev || rule).conditions, salesVolumeMin: parseFloat(e.target.value) || undefined }
                }))}
                placeholder="Optional minimum"
                data-testid="input-rule-min-volume"
              />
            </div>
            <div>
              <Label className="text-xs">Max Volume</Label>
              <Input
                type="number"
                step="0.01"
                value={currentRule.conditions.salesVolumeMax || ''}
                onChange={(e) => setLocalEditRule(prev => ({
                  ...(prev || rule),
                  conditions: { ...(prev || rule).conditions, salesVolumeMax: parseFloat(e.target.value) || undefined }
                }))}
                placeholder="Optional maximum"
                data-testid="input-rule-max-volume"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setEditingRule(null); setLocalEditRule(null); }}>Cancel</Button>
          <Button
            onClick={() => onSave(currentRule)}
            disabled={updateRuleMutation.isPending}
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
    
    return (
      <div key={rule.id || ruleIndex} className="bg-white dark:bg-gray-800 border rounded p-4">
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => { 
              setEditingRule({ ruleSetId, ruleIndex, rule });
              setLocalEditRule(rule);
            }}
            data-testid={`button-edit-rule-${ruleIndex}`}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
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
      </div>
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
            <Button
              onClick={() => setShowCalculation(!showCalculation)}
              variant="outline"
              className="flex items-center gap-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              data-testid="button-toggle-calculator"
            >
              <Calculator className="h-4 w-4" />
              {showCalculation ? 'Hide Calculator' : 'Show Calculator'}
            </Button>
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

      {/* Rule Edit Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => { setEditingRule(null); setLocalEditRule(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Royalty Rule</DialogTitle>
            </DialogHeader>
            {renderRuleEditor(editingRule.rule, (updatedRule) => 
              updateRuleMutation.mutate({
                ruleSetId: editingRule.ruleSetId,
                ruleIndex: editingRule.ruleIndex,
                updatedRule
              })
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Add Rule Dialog */}
      {isAddingRule && (
        <Dialog open={!!isAddingRule} onOpenChange={() => { setIsAddingRule(null); setLocalEditRule(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Royalty Rule</DialogTitle>
            </DialogHeader>
            {renderRuleEditor(
              {
                id: '',
                ruleName: '',
                ruleType: 'percentage',
                description: '',
                conditions: {},
                calculation: { baseField: 'netRevenue' },
                priority: 10,
                isActive: true,
                confidence: 1.0
              },
              (newRule) => addRuleMutation.mutate({ ruleSetId: isAddingRule, newRule })
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}