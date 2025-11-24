import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Upload, Download, Save, Trash2, Eye, FileJson, AlertCircle, CheckCircle2, Loader2, Settings, Layers, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ErpSystem, ErpEntity, LicenseiqEntity, LicenseiqField } from '@shared/schema';
import { formatDateUSA } from '@/lib/dateFormat';

interface FieldMapping {
  source_field: string | null;
  target_field: string;
  transformation_rule: string;
  confidence: number;
}

interface MappingResult {
  mappingResults: FieldMapping[];
  sourceSchema: any;
  targetSchema: any;
  entityType: string;
  erpSystem: string;
}

interface SavedMapping {
  id: string;
  mappingName: string;
  erpSystem: string;
  entityType: string;
  sourceSchema: any;
  targetSchema: any;
  mappingResults: FieldMapping[];
  status: string;
  aiModel: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface BatchSuggestion {
  erpEntityId: string;
  erpEntityName: string;
  erpEntityType: string;
  erpSchema: Record<string, string>;
  licenseiqEntityId: string | null;
  licenseiqEntityName: string | null;
  licenseiqSchema: Record<string, string> | null;
  fieldMappings: FieldMapping[];
  confidence: number;
  reasoning: string;
  erpFieldCount: number;
  mappedFieldCount: number;
}

export default function MasterDataMapping() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sourceSchema, setSourceSchema] = useState('');
  const [targetSchema, setTargetSchema] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedLicenseiqEntityId, setSelectedLicenseiqEntityId] = useState('');
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [saveMappingName, setSaveMappingName] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [viewMapping, setViewMapping] = useState<SavedMapping | null>(null);

  // Batch mapping state
  const [batchSystemId, setBatchSystemId] = useState('');
  const [batchEntityIds, setBatchEntityIds] = useState<string[]>([]);
  const [batchSuggestions, setBatchSuggestions] = useState<BatchSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch ERP systems from catalog
  const { data: erpSystemsData } = useQuery<{ systems: ErpSystem[] }>({
    queryKey: ['/api/erp-systems'],
  });

  // Fetch entities for selected ERP system (single mapping tab)
  const { data: erpEntitiesData } = useQuery<{ entities: ErpEntity[] }>({
    queryKey: ['/api/erp-entities', selectedSystemId],
    enabled: !!selectedSystemId,
    queryFn: () => fetch(`/api/erp-entities?systemId=${selectedSystemId}`).then(res => res.json()),
  });

  // Fetch entities for batch mapping tab
  const { data: batchErpEntitiesData } = useQuery<{ entities: ErpEntity[] }>({
    queryKey: ['/api/erp-entities', batchSystemId],
    enabled: !!batchSystemId,
    queryFn: () => fetch(`/api/erp-entities?systemId=${batchSystemId}`).then(res => res.json()),
  });

  // Fetch fields for selected ERP entity
  const { data: erpFieldsData } = useQuery<{ fields: any[] }>({
    queryKey: ['/api/erp-fields', selectedEntityId],
    enabled: !!selectedEntityId,
    queryFn: () => fetch(`/api/erp-fields?entityId=${selectedEntityId}`).then(res => res.json()),
  });

  // Fetch LicenseIQ entities
  const { data: licenseiqEntitiesData } = useQuery<{ entities: LicenseiqEntity[] }>({
    queryKey: ['/api/licenseiq-entities'],
  });

  // Fetch fields for selected LicenseIQ entity
  const { data: licenseiqFieldsData } = useQuery<{ fields: LicenseiqField[] }>({
    queryKey: ['/api/licenseiq-fields', selectedLicenseiqEntityId],
    enabled: !!selectedLicenseiqEntityId,
    queryFn: () => fetch(`/api/licenseiq-fields?entityId=${selectedLicenseiqEntityId}`).then(res => res.json()),
  });

  // Fetch saved mappings
  const { data: savedMappings = { mappings: [] }, refetch: refetchMappings } = useQuery<{ mappings: SavedMapping[] }>({
    queryKey: ['/api/mapping'],
  });

  const selectedSystem = erpSystemsData?.systems?.find(s => s.id === selectedSystemId);
  const selectedEntity = erpEntitiesData?.entities?.find(e => e.id === selectedEntityId);
  const selectedLicenseiqEntity = licenseiqEntitiesData?.entities?.find(e => e.id === selectedLicenseiqEntityId);

  // Auto-populate SOURCE schema when ERP entity is selected
  useEffect(() => {
    if (erpFieldsData?.fields) {
      const schema: Record<string, string> = {};
      erpFieldsData.fields.forEach(field => {
        schema[field.fieldName] = field.dataType;
      });
      setSourceSchema(JSON.stringify(schema, null, 2));
    }
  }, [erpFieldsData]);

  // Auto-populate TARGET schema when LicenseIQ entity is selected
  useEffect(() => {
    if (licenseiqFieldsData?.fields) {
      const schema: Record<string, string> = {};
      licenseiqFieldsData.fields.forEach(field => {
        schema[field.fieldName] = field.dataType;
      });
      setTargetSchema(JSON.stringify(schema, null, 2));
    }
  }, [licenseiqFieldsData]);

  // Clear batch entity selections when batch system changes
  useEffect(() => {
    setBatchEntityIds([]);
  }, [batchSystemId]);

  // Generate mapping mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { sourceSchema: any; targetSchema: any; entityType: string; erpSystem: string }) => {
      const response = await apiRequest('POST', '/api/mapping/generate', data);
      return response.json();
    },
    onSuccess: (data: MappingResult) => {
      setMappingResult(data);
      toast({
        title: 'Mapping Generated',
        description: `Successfully generated ${data.mappingResults.length} field mappings using AI.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate mapping',
        variant: 'destructive',
      });
    },
  });

  // Save mapping mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/mapping/save', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mapping Saved',
        description: 'Mapping configuration has been saved successfully.',
      });
      setSaveMappingName('');
      setSaveNotes('');
      refetchMappings();
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save mapping',
        variant: 'destructive',
      });
    },
  });

  // Batch generate mutation
  const batchGenerateMutation = useMutation({
    mutationFn: async (data: { erpSystemId: string; erpEntityIds: string[] }) => {
      const response = await apiRequest('POST', '/api/mapping/batch-generate', data);
      return response.json();
    },
    onSuccess: (data: { suggestions: BatchSuggestion[]; erpSystemName: string }) => {
      setBatchSuggestions(data.suggestions);
      // Auto-select high confidence mappings (90%+)
      const highConfidence = new Set(
        data.suggestions.filter(s => s.confidence >= 90).map(s => s.erpEntityId)
      );
      setSelectedSuggestions(highConfidence);
      toast({
        title: 'Batch Mapping Complete',
        description: `Generated ${data.suggestions.length} entity mappings. ${highConfidence.size} high-confidence matches auto-selected.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Batch Generation Failed',
        description: error.message || 'Failed to generate batch mappings',
        variant: 'destructive',
      });
    },
  });

  // Delete mapping mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/mapping/${id}`);
      if (response.status === 204) return { success: true };
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mapping Deleted',
        description: 'Mapping has been removed successfully.',
      });
      refetchMappings();
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete mapping',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateMapping = () => {
    let parsedSource, parsedTarget;
    
    try {
      parsedSource = JSON.parse(sourceSchema);
      parsedTarget = JSON.parse(targetSchema);
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please provide valid JSON schemas.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSystemId) {
      toast({
        title: 'Missing ERP System',
        description: 'Please select an ERP system.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEntityId) {
      toast({
        title: 'Missing Entity',
        description: 'Please select an entity type.',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({
      sourceSchema: parsedSource,
      targetSchema: parsedTarget,
      entityType: selectedEntity?.name || 'unknown',
      erpSystem: selectedSystem?.name || 'unknown',
    });
  };

  const handleSaveMapping = () => {
    if (!saveMappingName || !mappingResult) {
      toast({
        title: 'Invalid Data',
        description: 'Please provide a mapping name.',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate({
      mappingName: saveMappingName,
      erpSystem: mappingResult.erpSystem,
      entityType: mappingResult.entityType,
      sourceSchema: mappingResult.sourceSchema,
      targetSchema: mappingResult.targetSchema,
      mappingResults: mappingResult.mappingResults,
      notes: saveNotes || null,
    });
  };

  const handleLoadMapping = (mapping: SavedMapping) => {
    setSourceSchema(JSON.stringify(mapping.sourceSchema, null, 2));
    setTargetSchema(JSON.stringify(mapping.targetSchema, null, 2));
    // Note: Can't restore system/entity selection from names alone - would need IDs
    setMappingResult({
      mappingResults: mapping.mappingResults,
      sourceSchema: mapping.sourceSchema,
      targetSchema: mapping.targetSchema,
      entityType: mapping.entityType,
      erpSystem: mapping.erpSystem,
    });
    toast({
      title: 'Mapping Loaded',
      description: `Loaded mapping: ${mapping.mappingName}`,
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-500">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500">Medium ({confidence}%)</Badge>;
    return <Badge className="bg-red-500">Low ({confidence}%)</Badge>;
  };

  return (
    <MainLayout
      title="AI Master Data Mapping"
      description="Map your ERP field names to LicenseIQ standard fields using AI - Create reusable mapping templates"
      actions={
        <Button
          variant="outline"
          onClick={() => navigate('/erp-catalog')}
          data-testid="button-configure-erp"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure ERP Catalog
        </Button>
      }
    >
      <div className="space-y-6">

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" data-testid="tab-generate">Single Mapping</TabsTrigger>
          <TabsTrigger value="batch" data-testid="tab-batch">
            <Sparkles className="h-4 w-4 mr-2" />
            Batch Auto-Map
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved">Saved ({savedMappings.mappings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Source Schema Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-500" />
                  Source Schema (Your ERP System)
                </CardTitle>
                <CardDescription>
                  Select from your ERP catalog or paste JSON manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ERP Entity Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="erp-entity-schema">ERP Entity</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-orange-600 hover:text-orange-700"
                      onClick={() => navigate('/erp-catalog')}
                      data-testid="button-configure-erp-source"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure Catalog
                    </Button>
                  </div>
                  <Select 
                    value={selectedEntityId} 
                    onValueChange={(value) => {
                      setSelectedEntityId(value);
                    }}
                    disabled={!selectedSystemId || !erpEntitiesData?.entities?.length}
                  >
                    <SelectTrigger id="erp-entity-schema" data-testid="select-erp-entity-schema">
                      <SelectValue placeholder={
                        !selectedSystemId 
                          ? "Select ERP System below first..." 
                          : !erpEntitiesData?.entities?.length
                          ? "No entities available..."
                          : "Select ERP entity..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {erpEntitiesData?.entities?.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name} ({entity.entityType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedSystemId && (
                    <p className="text-sm text-muted-foreground">
                      ↓ Select an ERP System in the configuration section below to enable this dropdown
                    </p>
                  )}
                  {selectedEntity && (
                    <p className="text-sm text-muted-foreground">
                      {selectedEntity.description || `${selectedEntity.entityType} entity from ${selectedSystem?.name}`}
                    </p>
                  )}
                </div>

                {/* Schema JSON Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="source-schema">Schema JSON (Auto-populated)</Label>
                  <Textarea
                    id="source-schema"
                    value={sourceSchema}
                    onChange={(e) => setSourceSchema(e.target.value)}
                    placeholder={'{\n  "ITEM_NUMBER": "string",\n  "ITEM_DESCRIPTION": "string",\n  "ORDERED_QUANTITY": "number"\n}'}
                    className="font-mono text-sm min-h-[200px]"
                    data-testid="input-source-schema"
                  />
                  {selectedEntityId && erpFieldsData?.fields && (
                    <p className="text-xs text-green-600 dark:text-green-500">
                      ✓ Auto-populated with {erpFieldsData.fields.length} fields from {selectedEntity?.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Target Schema Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  Target Schema (LicenseIQ)
                </CardTitle>
                <CardDescription>
                  Select from your LicenseIQ schema catalog or paste JSON manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* LicenseIQ Entity Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="licenseiq-entity">LicenseIQ Entity</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => navigate('/licenseiq-schema')}
                      data-testid="button-configure-licenseiq"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure Schema
                    </Button>
                  </div>
                  <Select 
                    value={selectedLicenseiqEntityId} 
                    onValueChange={(value) => {
                      setSelectedLicenseiqEntityId(value);
                    }}
                  >
                    <SelectTrigger id="licenseiq-entity" data-testid="select-licenseiq-entity">
                      <SelectValue placeholder="Select LicenseIQ entity..." />
                    </SelectTrigger>
                    <SelectContent>
                      {licenseiqEntitiesData?.entities?.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name} ({entity.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLicenseiqEntity && (
                    <p className="text-sm text-muted-foreground">
                      {selectedLicenseiqEntity.description}
                    </p>
                  )}
                </div>

                {/* Auto-populated Schema */}
                <div className="space-y-2">
                  <Label htmlFor="target-schema">Schema JSON (Auto-populated)</Label>
                  <Textarea
                    id="target-schema"
                    value={targetSchema}
                    onChange={(e) => setTargetSchema(e.target.value)}
                    placeholder={'{\n  "contractId": "string",\n  "partyName": "string",\n  "effectiveDate": "date"\n}'}
                    className="font-mono text-sm min-h-[200px]"
                    data-testid="input-target-schema"
                  />
                  {selectedLicenseiqEntityId && licenseiqFieldsData?.fields && (
                    <p className="text-xs text-green-600 dark:text-green-500">
                      ✓ Auto-populated with {licenseiqFieldsData.fields.length} fields from {selectedLicenseiqEntity?.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Mapping Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!erpSystemsData?.systems?.length ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No ERP Systems Configured</AlertTitle>
                  <AlertDescription>
                    Please configure ERP systems in the catalog first.{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={() => navigate('/erp-catalog')}
                    >
                      Go to ERP Catalog
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="erp-system">ERP System *</Label>
                    <Select value={selectedSystemId} onValueChange={(value) => {
                      setSelectedSystemId(value);
                      setSelectedEntityId(''); // Reset entity when system changes
                    }}>
                      <SelectTrigger id="erp-system" data-testid="select-erp-system">
                        <SelectValue placeholder="Select ERP system..." />
                      </SelectTrigger>
                      <SelectContent>
                        {erpSystemsData.systems.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            {system.name} ({system.vendor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Entity Type *</Label>
                    <Select 
                      value={selectedEntityId} 
                      onValueChange={setSelectedEntityId}
                      disabled={!selectedSystemId || !erpEntitiesData?.entities?.length}
                    >
                      <SelectTrigger id="entity-type" data-testid="select-entity-type">
                        <SelectValue placeholder={
                          !selectedSystemId 
                            ? "Select ERP system first..." 
                            : !erpEntitiesData?.entities?.length
                              ? "No entities configured"
                              : "Select entity..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {erpEntitiesData?.entities?.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name} ({entity.technicalName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerateMapping}
                disabled={generateMutation.isPending || !sourceSchema || !targetSchema || !selectedSystemId || !selectedEntityId}
                className="w-full"
                size="lg"
                data-testid="button-generate-mapping"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI Mapping...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Mapping
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Mapping Results */}
          {mappingResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Mapping Results
                    </CardTitle>
                    <CardDescription>
                      {mappingResult.mappingResults.length} field mappings generated for {mappingResult.entityType}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const dataStr = JSON.stringify(mappingResult, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `mapping-${mappingResult.entityType}-${Date.now()}.json`;
                      a.click();
                    }}
                    data-testid="button-export-json"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source Field (Your ERP)</TableHead>
                        <TableHead>Target Field (LicenseIQ)</TableHead>
                        <TableHead>Transformation Rule</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappingResult.mappingResults.map((mapping, idx) => (
                        <TableRow key={idx} data-testid={`row-mapping-${idx}`}>
                          <TableCell className="font-mono text-sm">
                            {mapping.source_field || <span className="text-muted-foreground italic">No match</span>}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold">
                            {mapping.target_field}
                          </TableCell>
                          <TableCell className="text-sm">{mapping.transformation_rule}</TableCell>
                          <TableCell>{getConfidenceBadge(mapping.confidence)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Statistics */}
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>High Confidence</AlertTitle>
                    <AlertDescription>
                      {mappingResult.mappingResults.filter(m => m.confidence >= 90).length} mappings (≥90%)
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Medium Confidence</AlertTitle>
                    <AlertDescription>
                      {mappingResult.mappingResults.filter(m => m.confidence >= 70 && m.confidence < 90).length} mappings (70-89%)
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Requires Review</AlertTitle>
                    <AlertDescription>
                      {mappingResult.mappingResults.filter(m => m.confidence < 70).length} mappings (&lt;70%)
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Inline Save Configuration */}
                <div className="mt-6 p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Save Mapping Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Provide a name and optional notes to save this mapping for reuse
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mapping-name">Mapping Name *</Label>
                      <Input
                        id="mapping-name"
                        value={saveMappingName}
                        onChange={(e) => setSaveMappingName(e.target.value)}
                        placeholder="e.g., Customer Master Mapping v1"
                        data-testid="input-mapping-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={saveNotes}
                        onChange={(e) => setSaveNotes(e.target.value)}
                        placeholder="Add any notes about this mapping configuration..."
                        rows={3}
                        data-testid="input-mapping-notes"
                      />
                    </div>
                    <Button
                      onClick={handleSaveMapping}
                      disabled={saveMutation.isPending || !saveMappingName}
                      className="w-full"
                      size="lg"
                      data-testid="button-save-mapping"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Mapping...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Mapping
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          {/* Batch Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Batch Auto-Mapping
              </CardTitle>
              <CardDescription>
                Automatically map multiple ERP entities at once using AI - Review and approve suggestions before saving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Selection */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="batch-system">ERP System</Label>
                    <Select value={batchSystemId} onValueChange={setBatchSystemId}>
                      <SelectTrigger id="batch-system" data-testid="select-batch-system">
                        <SelectValue placeholder="Select ERP system..." />
                      </SelectTrigger>
                      <SelectContent>
                        {erpSystemsData?.systems?.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            {system.name} (v{system.version})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Entity Multi-Select */}
                {batchSystemId && (
                  <div className="space-y-2">
                    <Label>Select Entities to Map ({batchEntityIds.length} selected)</Label>
                    <Card className="p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {batchErpEntitiesData?.entities?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No entities available for this system</p>
                        ) : (
                          batchErpEntitiesData?.entities?.map((entity) => (
                            <label key={entity.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer">
                              <input
                                type="checkbox"
                                checked={batchEntityIds.includes(entity.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBatchEntityIds([...batchEntityIds, entity.id]);
                                  } else {
                                    setBatchEntityIds(batchEntityIds.filter(id => id !== entity.id));
                                  }
                                }}
                                className="mt-1"
                                data-testid={`checkbox-entity-${entity.id}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{entity.name}</div>
                                <div className="text-sm text-muted-foreground">{entity.entityType} - {entity.description || 'No description'}</div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </Card>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchEntityIds(batchErpEntitiesData?.entities?.map(e => e.id) || [])}
                        data-testid="button-select-all-entities"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchEntityIds([])}
                        data-testid="button-deselect-all-entities"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={() => {
                    if (batchSystemId && batchEntityIds.length > 0) {
                      batchGenerateMutation.mutate({ erpSystemId: batchSystemId, erpEntityIds: batchEntityIds });
                    }
                  }}
                  disabled={!batchSystemId || batchEntityIds.length === 0 || batchGenerateMutation.isPending}
                  className="w-full"
                  data-testid="button-batch-generate"
                >
                  {batchGenerateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Mappings ({batchEntityIds.length} entities)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Batch Mappings ({batchEntityIds.length} entities)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          {batchSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mapping Suggestions - Review & Approve</CardTitle>
                    <CardDescription>
                      {selectedSuggestions.size} of {batchSuggestions.length} mappings selected for saving
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const highConf = new Set(batchSuggestions.filter(s => s.confidence >= 90).map(s => s.erpEntityId));
                        setSelectedSuggestions(highConf);
                      }}
                      data-testid="button-select-high-confidence"
                    >
                      Select High Confidence (≥90%)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSuggestions(new Set())}
                      data-testid="button-deselect-all-suggestions"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedSuggestions.size === batchSuggestions.filter(s => s.licenseiqEntityId).length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSuggestions(new Set(batchSuggestions.filter(s => s.licenseiqEntityId).map(s => s.erpEntityId)));
                              } else {
                                setSelectedSuggestions(new Set());
                              }
                            }}
                            data-testid="checkbox-select-all-suggestions"
                          />
                        </TableHead>
                        <TableHead>ERP Entity</TableHead>
                        <TableHead>LicenseIQ Entity</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Fields</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchSuggestions.map((suggestion) => (
                        <>
                          <TableRow key={suggestion.erpEntityId} className={expandedRows.has(suggestion.erpEntityId) ? 'bg-muted/50' : ''}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedSuggestions.has(suggestion.erpEntityId)}
                                disabled={!suggestion.licenseiqEntityId}
                                onChange={(e) => {
                                  const newSet = new Set(selectedSuggestions);
                                  if (e.target.checked) {
                                    newSet.add(suggestion.erpEntityId);
                                  } else {
                                    newSet.delete(suggestion.erpEntityId);
                                  }
                                  setSelectedSuggestions(newSet);
                                }}
                                data-testid={`checkbox-suggestion-${suggestion.erpEntityId}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{suggestion.erpEntityName}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.erpEntityType}</div>
                            </TableCell>
                            <TableCell>
                              {suggestion.licenseiqEntityId ? (
                                <div className="font-medium">{suggestion.licenseiqEntityName}</div>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">No match found</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={suggestion.confidence >= 90 ? 'default' : suggestion.confidence >= 70 ? 'secondary' : 'outline'}
                                className={
                                  suggestion.confidence >= 90 ? 'bg-green-500' : 
                                  suggestion.confidence >= 70 ? 'bg-yellow-500' : 
                                  'bg-red-500 text-white'
                                }
                              >
                                {suggestion.confidence}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {suggestion.mappedFieldCount}/{suggestion.erpFieldCount} mapped
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newExpanded = new Set(expandedRows);
                                  if (expandedRows.has(suggestion.erpEntityId)) {
                                    newExpanded.delete(suggestion.erpEntityId);
                                  } else {
                                    newExpanded.add(suggestion.erpEntityId);
                                  }
                                  setExpandedRows(newExpanded);
                                }}
                                data-testid={`button-expand-${suggestion.erpEntityId}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(suggestion.erpEntityId) && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/30 p-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">AI Reasoning:</h4>
                                    <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                                  </div>
                                  {suggestion.fieldMappings.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Field Mappings ({suggestion.fieldMappings.length}):</h4>
                                      <div className="rounded border bg-background">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Source Field (ERP)</TableHead>
                                              <TableHead>Target Field (LicenseIQ)</TableHead>
                                              <TableHead>Transformation</TableHead>
                                              <TableHead className="w-24">Confidence</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {suggestion.fieldMappings.map((fm, idx) => (
                                              <TableRow key={idx}>
                                                <TableCell className="font-mono text-xs">
                                                  {fm.source_field || <span className="text-muted-foreground italic">null</span>}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{fm.target_field}</TableCell>
                                                <TableCell className="text-xs">{fm.transformation_rule}</TableCell>
                                                <TableCell>
                                                  <Badge variant={fm.confidence >= 80 ? 'default' : 'secondary'} className="text-xs">
                                                    {fm.confidence}%
                                                  </Badge>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Save Selected Button */}
                {selectedSuggestions.size > 0 && (
                  <div className="mt-4 flex justify-end gap-2">
                    <Alert className="flex-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Ready to Save</AlertTitle>
                      <AlertDescription>
                        {selectedSuggestions.size} mapping{selectedSuggestions.size !== 1 ? 's' : ''} selected. Click Save to add them to your catalog.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={async () => {
                        const selectedMappings = batchSuggestions.filter(s => selectedSuggestions.has(s.erpEntityId));
                        let savedCount = 0;
                        
                        for (const suggestion of selectedMappings) {
                          if (!suggestion.licenseiqEntityId) continue;
                          
                          try {
                            await apiRequest('POST', '/api/mapping/save', {
                              mappingName: `${suggestion.erpEntityName} → ${suggestion.licenseiqEntityName}`,
                              erpSystem: erpSystemsData?.systems?.find(s => s.id === batchSystemId)?.name || '',
                              entityType: suggestion.licenseiqEntityName || '',
                              sourceSchema: suggestion.erpSchema,
                              targetSchema: suggestion.licenseiqSchema,
                              mappingResults: suggestion.fieldMappings,
                              notes: `AI-generated batch mapping with ${suggestion.confidence}% confidence. ${suggestion.reasoning}`,
                            });
                            savedCount++;
                          } catch (error) {
                            console.error(`Failed to save mapping for ${suggestion.erpEntityName}:`, error);
                          }
                        }
                        
                        toast({
                          title: 'Batch Save Complete',
                          description: `Successfully saved ${savedCount} of ${selectedMappings.length} mappings.`,
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ['/api/mapping'] });
                        setBatchSuggestions([]);
                        setSelectedSuggestions(new Set());
                        setBatchEntityIds([]);
                      }}
                      className="shrink-0"
                      data-testid="button-save-selected-mappings"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Selected ({selectedSuggestions.size})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Mapping Configurations</CardTitle>
              <CardDescription>
                Previously saved mapping configurations for Oracle ERP integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedMappings.mappings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved mappings yet. Generate and save your first mapping!</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mapping Name</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>ERP System</TableHead>
                        <TableHead>Field Count</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedMappings.mappings.map((mapping) => (
                        <TableRow key={mapping.id} data-testid={`row-saved-mapping-${mapping.id}`}>
                          <TableCell className="font-semibold">{mapping.mappingName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{mapping.entityType}</Badge>
                          </TableCell>
                          <TableCell>{mapping.erpSystem}</TableCell>
                          <TableCell>{mapping.mappingResults.length} fields</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateUSA(mapping.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewMapping(mapping)}
                                data-testid={`button-view-${mapping.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadMapping(mapping)}
                                data-testid={`button-load-${mapping.id}`}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMutation.mutate(mapping.id)}
                                data-testid={`button-delete-${mapping.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      {viewMapping && (
        <Dialog open={!!viewMapping} onOpenChange={() => setViewMapping(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-view-mapping">
            <DialogHeader>
              <DialogTitle>{viewMapping.mappingName}</DialogTitle>
              <DialogDescription>
                {viewMapping.erpSystem} - {viewMapping.entityType} | {viewMapping.mappingResults.length} field mappings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewMapping.notes && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm"><strong>Notes:</strong> {viewMapping.notes}</p>
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Field</TableHead>
                      <TableHead>Target Field</TableHead>
                      <TableHead>Transformation</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewMapping.mappingResults.map((mapping, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">
                          {mapping.source_field || <span className="text-muted-foreground italic">No match</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {mapping.target_field}
                        </TableCell>
                        <TableCell className="text-sm">{mapping.transformation_rule}</TableCell>
                        <TableCell>{getConfidenceBadge(mapping.confidence)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewMapping(null)} data-testid="button-close-view">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </MainLayout>
  );
}
