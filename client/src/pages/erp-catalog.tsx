import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Database, FileText, Table as TableIcon, Save } from "lucide-react";
import type { ErpSystem, ErpEntity, ErpField } from "@shared/schema";

export default function ErpCatalogPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("systems");
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [systemDialogOpen, setSystemDialogOpen] = useState(false);
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);

  // Fetch ERP Systems
  const { data: systemsData, isLoading: systemsLoading } = useQuery<{ systems: ErpSystem[] }>({
    queryKey: ['/api/erp-systems'],
  });

  // Fetch ERP Entities for selected system
  const { data: entitiesData, isLoading: entitiesLoading } = useQuery<{ entities: ErpEntity[] }>({
    queryKey: ['/api/erp-entities', selectedSystemId],
    enabled: !!selectedSystemId,
    queryFn: () => fetch(`/api/erp-entities?systemId=${selectedSystemId}`).then(res => res.json()),
  });

  // Fetch ERP Fields for selected entity
  const { data: fieldsData, isLoading: fieldsLoading } = useQuery<{ fields: ErpField[] }>({
    queryKey: ['/api/erp-fields', selectedEntityId],
    enabled: !!selectedEntityId,
    queryFn: () => fetch(`/api/erp-fields?entityId=${selectedEntityId}`).then(res => res.json()),
  });

  // Delete mutations
  const deleteSystemMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/erp-systems/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp-systems'] });
      toast({ title: "Success", description: "ERP system deleted successfully" });
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/erp-entities/${id}`),
    onSuccess: () => {
      // Invalidate all entity queries for all systems
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/erp-entities' });
      toast({ title: "Success", description: "Entity deleted successfully" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/erp-fields/${id}`),
    onSuccess: () => {
      // Invalidate all field queries for all entities
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/erp-fields' });
      toast({ title: "Success", description: "Field deleted successfully" });
    },
  });

  const selectedSystem = systemsData?.systems?.find(s => s.id === selectedSystemId);
  const selectedEntity = entitiesData?.entities?.find(e => e.id === selectedEntityId);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with Back Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/master-data-mapping')}
            data-testid="button-back"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mapping
          </Button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Settings</span>
          <span>/</span>
          <span>ERP Catalog</span>
          {selectedSystemId && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">{selectedSystem?.name}</span>
            </>
          )}
          {selectedEntityId && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">{selectedEntity?.name}</span>
            </>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            ERP Catalog Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure ERP systems, entities, and fields for universal data mapping
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="systems" data-testid="tab-systems">
            <Database className="h-4 w-4 mr-2" />
            ERP Systems
          </TabsTrigger>
          <TabsTrigger value="entities" data-testid="tab-entities">
            <TableIcon className="h-4 w-4 mr-2" />
            Entities
          </TabsTrigger>
          <TabsTrigger value="fields" data-testid="tab-fields">
            <FileText className="h-4 w-4 mr-2" />
            Fields
          </TabsTrigger>
        </TabsList>

        {/* Systems Tab */}
        <TabsContent value="systems" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ERP Systems</CardTitle>
                  <CardDescription>
                    Manage ERP platforms (Oracle, SAP, NetSuite, custom systems)
                  </CardDescription>
                </div>
                <AddSystemDialog open={systemDialogOpen} onOpenChange={setSystemDialogOpen}>
                  <Button data-testid="button-add-system">
                    <Plus className="h-4 w-4 mr-2" />
                    Add System
                  </Button>
                </AddSystemDialog>
              </div>
            </CardHeader>
            <CardContent>
              {systemsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading systems...</div>
              ) : !systemsData?.systems?.length ? (
                <div className="text-center py-8 text-muted-foreground">No ERP systems configured yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemsData.systems.map((system) => (
                      <TableRow key={system.id} data-testid={`row-system-${system.id}`}>
                        <TableCell className="font-medium">{system.name}</TableCell>
                        <TableCell>{system.vendor}</TableCell>
                        <TableCell>{system.version || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={system.category === 'cloud' ? 'default' : 'secondary'}>
                            {system.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={system.status === 'active' ? 'default' : 'secondary'}>
                            {system.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSystemId(system.id);
                              setActiveTab("entities");
                            }}
                            data-testid={`button-view-entities-${system.id}`}
                          >
                            View Entities
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSystemMutation.mutate(system.id)}
                            data-testid={`button-delete-system-${system.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ERP Entities</CardTitle>
                  <CardDescription>
                    {selectedSystemId 
                      ? `Entities for ${selectedSystem?.name}` 
                      : 'Select an ERP system to view entities'}
                  </CardDescription>
                </div>
                {selectedSystemId && (
                  <AddEntityDialog 
                    open={entityDialogOpen} 
                    onOpenChange={setEntityDialogOpen}
                    systemId={selectedSystemId}
                  >
                    <Button data-testid="button-add-entity">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entity
                    </Button>
                  </AddEntityDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedSystemId ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Please select an ERP system first</p>
                  <Button onClick={() => setActiveTab("systems")} data-testid="button-go-to-systems">
                    Go to Systems Tab
                  </Button>
                </div>
              ) : entitiesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading entities...</div>
              ) : !entitiesData?.entities?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No entities configured for this system yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Technical Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entitiesData.entities.map((entity) => (
                      <TableRow key={entity.id} data-testid={`row-entity-${entity.id}`}>
                        <TableCell className="font-medium">{entity.name}</TableCell>
                        <TableCell className="font-mono text-sm">{entity.technicalName}</TableCell>
                        <TableCell>
                          <Badge>{entity.entityType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                            {entity.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEntityId(entity.id);
                              setActiveTab("fields");
                            }}
                            data-testid={`button-view-fields-${entity.id}`}
                          >
                            View Fields
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEntityMutation.mutate(entity.id)}
                            data-testid={`button-delete-entity-${entity.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Entity Fields</CardTitle>
                  <CardDescription>
                    {selectedEntityId 
                      ? `Fields for ${selectedEntity?.name}` 
                      : 'Select an entity to view fields'}
                  </CardDescription>
                </div>
                {selectedEntityId && (
                  <AddFieldDialog 
                    open={fieldDialogOpen} 
                    onOpenChange={setFieldDialogOpen}
                    entityId={selectedEntityId}
                  >
                    <Button data-testid="button-add-field">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </AddFieldDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedEntityId ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Please select an entity first</p>
                  <Button onClick={() => setActiveTab("entities")} data-testid="button-go-to-entities">
                    Go to Entities Tab
                  </Button>
                </div>
              ) : fieldsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading fields...</div>
              ) : !fieldsData?.fields?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fields configured for this entity yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Primary Key</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Sample Values</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldsData.fields.map((field) => (
                      <TableRow key={field.id} data-testid={`row-field-${field.id}`}>
                        <TableCell className="font-mono font-medium">{field.fieldName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.dataType}</Badge>
                        </TableCell>
                        <TableCell>
                          {field.isPrimaryKey ? <Badge>PK</Badge> : '-'}
                        </TableCell>
                        <TableCell>
                          {field.isRequired ? <Badge variant="secondary">Required</Badge> : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {field.sampleValues || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFieldMutation.mutate(field.id)}
                            data-testid={`button-delete-field-${field.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add System Dialog Component
function AddSystemDialog({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    version: '',
    description: '',
    category: 'enterprise',
    status: 'active'
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => apiRequest('POST', '/api/erp-systems', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp-systems'] });
      toast({ title: "Success", description: "ERP system created successfully" });
      onOpenChange(false);
      setFormData({ name: '', vendor: '', version: '', description: '', category: 'enterprise', status: 'active' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add ERP System</DialogTitle>
          <DialogDescription>Configure a new ERP platform for data mapping</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">System Name</Label>
            <Input 
              id="name"
              placeholder="e.g., Oracle EBS, SAP S/4HANA"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              data-testid="input-system-name"
            />
          </div>
          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Input 
              id="vendor"
              placeholder="e.g., Oracle, SAP, Microsoft"
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              data-testid="input-vendor"
            />
          </div>
          <div>
            <Label htmlFor="version">Version (Optional)</Label>
            <Input 
              id="version"
              placeholder="e.g., R12.2, 2023"
              value={formData.version}
              onChange={(e) => setFormData({...formData, version: e.target.value})}
              data-testid="input-version"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Brief description of the ERP system"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              data-testid="input-description"
            />
          </div>
          <Button 
            onClick={() => createMutation.mutate(formData)} 
            disabled={!formData.name || !formData.vendor || createMutation.isPending}
            className="w-full"
            data-testid="button-save-system"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Saving...' : 'Save System'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Entity Dialog Component
function AddEntityDialog({ children, open, onOpenChange, systemId }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void; systemId: string }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    systemId,
    name: '',
    technicalName: '',
    entityType: 'master_data',
    description: '',
    status: 'active'
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => apiRequest('POST', '/api/erp-entities', data),
    onSuccess: () => {
      // Invalidate all entity queries for all systems
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/erp-entities' });
      toast({ title: "Success", description: "Entity created successfully" });
      onOpenChange(false);
      setFormData({ systemId, name: '', technicalName: '', entityType: 'master_data', description: '', status: 'active' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Entity</DialogTitle>
          <DialogDescription>Define a table or entity for this ERP system</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="entity-name">Entity Name</Label>
            <Input 
              id="entity-name"
              placeholder="e.g., Customers, Items, Invoices"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              data-testid="input-entity-name"
            />
          </div>
          <div>
            <Label htmlFor="technical-name">Technical Name</Label>
            <Input 
              id="technical-name"
              placeholder="e.g., HZ_PARTIES, MTL_SYSTEM_ITEMS_B"
              value={formData.technicalName}
              onChange={(e) => setFormData({...formData, technicalName: e.target.value})}
              data-testid="input-technical-name"
            />
          </div>
          <div>
            <Label htmlFor="entity-type">Entity Type</Label>
            <Select value={formData.entityType} onValueChange={(value) => setFormData({...formData, entityType: value})}>
              <SelectTrigger data-testid="select-entity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master_data">Master Data</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="entity-description">Description</Label>
            <Textarea 
              id="entity-description"
              placeholder="Brief description of what this entity represents"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              data-testid="input-entity-description"
            />
          </div>
          <Button 
            onClick={() => createMutation.mutate(formData)} 
            disabled={!formData.name || !formData.technicalName || createMutation.isPending}
            className="w-full"
            data-testid="button-save-entity"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Saving...' : 'Save Entity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Field Dialog Component
function AddFieldDialog({ children, open, onOpenChange, entityId }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void; entityId: string }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    entityId,
    fieldName: '',
    dataType: 'VARCHAR2',
    description: '',
    isPrimaryKey: false,
    isRequired: false,
    sampleValues: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => apiRequest('POST', '/api/erp-fields', data),
    onSuccess: () => {
      // Invalidate all field queries for all entities
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/erp-fields' });
      toast({ title: "Success", description: "Field created successfully" });
      onOpenChange(false);
      setFormData({ entityId, fieldName: '', dataType: 'VARCHAR2', description: '', isPrimaryKey: false, isRequired: false, sampleValues: '' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
          <DialogDescription>Define a field/column for this entity</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="field-name">Field Name</Label>
            <Input 
              id="field-name"
              placeholder="e.g., CUSTOMER_ID, PARTY_NAME"
              value={formData.fieldName}
              onChange={(e) => setFormData({...formData, fieldName: e.target.value})}
              data-testid="input-field-name"
            />
          </div>
          <div>
            <Label htmlFor="data-type">Data Type</Label>
            <Select value={formData.dataType} onValueChange={(value) => setFormData({...formData, dataType: value})}>
              <SelectTrigger data-testid="select-data-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VARCHAR2">VARCHAR2</SelectItem>
                <SelectItem value="NUMBER">NUMBER</SelectItem>
                <SelectItem value="DATE">DATE</SelectItem>
                <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                <SelectItem value="CLOB">CLOB</SelectItem>
                <SelectItem value="INTEGER">INTEGER</SelectItem>
                <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="is-primary-key" 
              checked={formData.isPrimaryKey}
              onChange={(e) => setFormData({...formData, isPrimaryKey: e.target.checked})}
              data-testid="checkbox-primary-key"
            />
            <Label htmlFor="is-primary-key">Primary Key</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="is-required" 
              checked={formData.isRequired}
              onChange={(e) => setFormData({...formData, isRequired: e.target.checked})}
              data-testid="checkbox-required"
            />
            <Label htmlFor="is-required">Required</Label>
          </div>
          <div>
            <Label htmlFor="sample-values">Sample Values</Label>
            <Input 
              id="sample-values"
              placeholder="e.g., 12345, 67890"
              value={formData.sampleValues}
              onChange={(e) => setFormData({...formData, sampleValues: e.target.value})}
              data-testid="input-sample-values"
            />
          </div>
          <div>
            <Label htmlFor="field-description">Description</Label>
            <Textarea 
              id="field-description"
              placeholder="Brief description of this field"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              data-testid="input-field-description"
            />
          </div>
          <Button 
            onClick={() => createMutation.mutate(formData)} 
            disabled={!formData.fieldName || !formData.dataType || createMutation.isPending}
            className="w-full"
            data-testid="button-save-field"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Saving...' : 'Save Field'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
