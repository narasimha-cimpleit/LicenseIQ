import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Sparkles, Upload, Download, Save, Trash2, Eye, FileJson, AlertCircle, CheckCircle2, Loader2, Settings, ArrowLeft, Layers } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ErpSystem, ErpEntity, LicenseiqEntity, LicenseiqField } from '@shared/schema';

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewMapping, setViewMapping] = useState<SavedMapping | null>(null);

  // Fetch ERP systems from catalog
  const { data: erpSystemsData } = useQuery<{ systems: ErpSystem[] }>({
    queryKey: ['/api/erp-systems'],
  });

  // Fetch entities for selected ERP system
  const { data: erpEntitiesData } = useQuery<{ entities: ErpEntity[] }>({
    queryKey: ['/api/erp-entities', selectedSystemId],
    enabled: !!selectedSystemId,
    queryFn: () => fetch(`/api/erp-entities?systemId=${selectedSystemId}`).then(res => res.json()),
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

  // Auto-populate target schema when LicenseIQ entity is selected
  useEffect(() => {
    if (licenseiqFieldsData?.fields) {
      const schema: Record<string, string> = {};
      licenseiqFieldsData.fields.forEach(field => {
        schema[field.fieldName] = field.dataType;
      });
      setTargetSchema(JSON.stringify(schema, null, 2));
    }
  }, [licenseiqFieldsData]);

  // Generate mapping mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { sourceSchema: any; targetSchema: any; entityType: string; erpSystem: string }) => {
      const response = await apiRequest('/api/mapping/generate', 'POST', data);
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
      const response = await apiRequest('/api/mapping/save', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mapping Saved',
        description: 'Mapping configuration has been saved successfully.',
      });
      setShowSaveDialog(false);
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

  // Delete mapping mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/mapping/${id}`, 'DELETE');
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button 
          onClick={() => navigate('/contracts')} 
          className="hover:text-foreground transition-colors"
          data-testid="breadcrumb-home"
        >
          Home
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">AI Master Data Mapping</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Master Data Mapping
          </h1>
          <p className="text-muted-foreground mt-1">
            Map your ERP field names to LicenseIQ standard fields using AI - Create reusable mapping templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/contracts')}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/erp-catalog')}
            data-testid="button-configure-erp"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure ERP Catalog
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" data-testid="tab-generate">Generate Mapping</TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved">Saved Mappings ({savedMappings.mappings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Source Schema Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-orange-500" />
                  Source Schema (Your ERP System)
                </CardTitle>
                <CardDescription>
                  Paste your ERP data schema as JSON (Oracle, SAP, NetSuite, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sourceSchema}
                  onChange={(e) => setSourceSchema(e.target.value)}
                  placeholder={'{\n  "CUSTOMER_ID": "number",\n  "CUSTOMER_NAME": "varchar(240)",\n  "CREATION_DATE": "date"\n}'}
                  className="font-mono text-sm min-h-[300px]"
                  data-testid="input-source-schema"
                />
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
                  <div className="flex gap-2">
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
                    <Button onClick={() => setShowSaveDialog(true)} data-testid="button-save-mapping">
                      <Save className="mr-2 h-4 w-4" />
                      Save Mapping
                    </Button>
                  </div>
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
                            {new Date(mapping.createdAt).toLocaleDateString()}
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

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent data-testid="dialog-save-mapping">
          <DialogHeader>
            <DialogTitle>Save Mapping Configuration</DialogTitle>
            <DialogDescription>
              Provide a name and optional notes for this mapping configuration.
            </DialogDescription>
          </DialogHeader>
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
                data-testid="input-mapping-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} data-testid="button-cancel-save">
              Cancel
            </Button>
            <Button
              onClick={handleSaveMapping}
              disabled={saveMutation.isPending || !saveMappingName}
              data-testid="button-confirm-save"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Mapping
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
  );
}
