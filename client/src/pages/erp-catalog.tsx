import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
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
import { Plus, Edit, Trash2, Database, FileText, Table as TableIcon, Save } from "lucide-react";
import type { ErpSystem, ErpEntity, ErpField } from "@shared/schema";

export default function ErpCatalogPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("systems");
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  // Inline form states and form data
  const [showSystemForm, setShowSystemForm] = useState(false);
  const [systemForm, setSystemForm] = useState({ name: '', vendor: '', version: '', description: '', category: 'enterprise', status: 'active' });
  
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [entityForm, setEntityForm] = useState({ systemId: '', name: '', technicalName: '', entityType: 'master_data', description: '', status: 'active' });
  
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldForm, setFieldForm] = useState({ entityId: '', fieldName: '', dataType: 'VARCHAR2', description: '', isPrimaryKey: false, isRequired: false, sampleValues: '' });

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

  // System mutations
  const createSystemMutation = useMutation({
    mutationFn: async (data: typeof systemForm) => apiRequest('POST', '/api/erp-systems', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp-systems'] });
      toast({ title: "Success", description: "ERP system created successfully" });
      setShowSystemForm(false);
      setSystemForm({ name: '', vendor: '', version: '', description: '', category: 'enterprise', status: 'active' });
    },
  });

  const deleteSystemMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/erp-systems/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp-systems'] });
      toast({ title: "Success", description: "ERP system deleted successfully" });
    },
  });

  const createEntityMutation = useMutation({
    mutationFn: async (data: typeof entityForm) => apiRequest('POST', '/api/erp-entities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/erp-entities' });
      toast({ title: "Success", description: "Entity created successfully" });
      setShowEntityForm(false);
      setEntityForm({ systemId: selectedSystemId!, name: '', technicalName: '', entityType: 'master_data', description: '', status: 'active' });
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

  const createFieldMutation = useMutation({
    mutationFn: async (data: typeof fieldForm) => apiRequest('POST', '/api/erp-fields', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/erp-fields' });
      toast({ title: "Success", description: "Field created successfully" });
      setShowFieldForm(false);
      setFieldForm({ entityId: selectedEntityId!, fieldName: '', dataType: 'VARCHAR2', description: '', isPrimaryKey: false, isRequired: false, sampleValues: '' });
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
    <MainLayout
      title="ERP Catalog Management"
      description="Configure ERP systems, entities, and fields for universal data mapping"
    >
      <div className="space-y-6">

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
                <Button onClick={() => setShowSystemForm(true)} data-testid="button-add-system">
                  <Plus className="h-4 w-4 mr-2" />
                  Add System
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Inline System Form */}
              {showSystemForm && (
                <Card className="border-2 border-primary/20 bg-primary/5 mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Add ERP System</span>
                      <Button variant="ghost" size="sm" onClick={() => {setShowSystemForm(false); setSystemForm({ name: '', vendor: '', version: '', description: '', category: 'enterprise', status: 'active' });}}>✕</Button>
                    </CardTitle>
                    <CardDescription>Configure a new ERP platform for data mapping</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">System Name</Label>
                      <Input id="name" placeholder="e.g., Oracle EBS, SAP S/4HANA" value={systemForm.name} onChange={(e) => setSystemForm({...systemForm, name: e.target.value})} data-testid="input-system-name" />
                    </div>
                    <div>
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input id="vendor" placeholder="e.g., Oracle, SAP, Microsoft" value={systemForm.vendor} onChange={(e) => setSystemForm({...systemForm, vendor: e.target.value})} data-testid="input-vendor" />
                    </div>
                    <div>
                      <Label htmlFor="version">Version (Optional)</Label>
                      <Input id="version" placeholder="e.g., R12.2, 2023" value={systemForm.version} onChange={(e) => setSystemForm({...systemForm, version: e.target.value})} data-testid="input-version" />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={systemForm.category} onValueChange={(value) => setSystemForm({...systemForm, category: value})}>
                        <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="cloud">Cloud</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Brief description of the ERP system" value={systemForm.description} onChange={(e) => setSystemForm({...systemForm, description: e.target.value})} rows={2} data-testid="input-description" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {setShowSystemForm(false); setSystemForm({ name: '', vendor: '', version: '', description: '', category: 'enterprise', status: 'active' });}} className="flex-1">Cancel</Button>
                      <Button onClick={() => createSystemMutation.mutate(systemForm)} disabled={!systemForm.name || !systemForm.vendor || createSystemMutation.isPending} className="flex-1" data-testid="button-save-system">
                        <Save className="h-4 w-4 mr-2" />
                        {createSystemMutation.isPending ? 'Saving...' : 'Save System'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                  <Button onClick={() => {setEntityForm({...entityForm, systemId: selectedSystemId}); setShowEntityForm(true);}} data-testid="button-add-entity">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entity
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Inline Entity Form */}
              {showEntityForm && selectedSystemId && (
                <Card className="border-2 border-primary/20 bg-primary/5 mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Add Entity</span>
                      <Button variant="ghost" size="sm" onClick={() => {setShowEntityForm(false); setEntityForm({ systemId: selectedSystemId, name: '', technicalName: '', entityType: 'master_data', description: '', status: 'active' });}}>✕</Button>
                    </CardTitle>
                    <CardDescription>Define a table or entity for this ERP system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Entity Name</Label>
                      <Input placeholder="e.g., Customers, Items, Invoices" value={entityForm.name} onChange={(e) => setEntityForm({...entityForm, name: e.target.value})} data-testid="input-entity-name" />
                    </div>
                    <div>
                      <Label>Technical Name</Label>
                      <Input placeholder="e.g., CUSTOMERS, AR_CUSTOMERS" value={entityForm.technicalName} onChange={(e) => setEntityForm({...entityForm, technicalName: e.target.value})} data-testid="input-technical-name" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {setShowEntityForm(false); setEntityForm({ systemId: selectedSystemId, name: '', technicalName: '', entityType: 'master_data', description: '', status: 'active' });}} className="flex-1">Cancel</Button>
                      <Button onClick={() => createEntityMutation.mutate(entityForm)} disabled={!entityForm.name || !entityForm.technicalName || createEntityMutation.isPending} className="flex-1" data-testid="button-save-entity">
                        <Save className="h-4 w-4 mr-2" />
                        {createEntityMutation.isPending ? 'Saving...' : 'Save Entity'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                  <Button onClick={() => {setFieldForm({...fieldForm, entityId: selectedEntityId}); setShowFieldForm(true);}} data-testid="button-add-field">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Inline Field Form */}
              {showFieldForm && selectedEntityId && (
                <Card className="border-2 border-primary/20 bg-primary/5 mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Add Field</span>
                      <Button variant="ghost" size="sm" onClick={() => {setShowFieldForm(false); setFieldForm({ entityId: selectedEntityId, fieldName: '', dataType: 'VARCHAR2', description: '', isPrimaryKey: false, isRequired: false, sampleValues: '' });}}>✕</Button>
                    </CardTitle>
                    <CardDescription>Define a field/column for this entity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Field Name</Label>
                      <Input placeholder="e.g., CUSTOMER_ID, PARTY_NAME" value={fieldForm.fieldName} onChange={(e) => setFieldForm({...fieldForm, fieldName: e.target.value})} data-testid="input-field-name" />
                    </div>
                    <div>
                      <Label>Data Type</Label>
                      <Select value={fieldForm.dataType} onValueChange={(value) => setFieldForm({...fieldForm, dataType: value})}>
                        <SelectTrigger data-testid="select-data-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VARCHAR2">VARCHAR2</SelectItem>
                          <SelectItem value="NUMBER">NUMBER</SelectItem>
                          <SelectItem value="DATE">DATE</SelectItem>
                          <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {setShowFieldForm(false); setFieldForm({ entityId: selectedEntityId, fieldName: '', dataType: 'VARCHAR2', description: '', isPrimaryKey: false, isRequired: false, sampleValues: '' });}} className="flex-1">Cancel</Button>
                      <Button onClick={() => createFieldMutation.mutate(fieldForm)} disabled={!fieldForm.fieldName || createFieldMutation.isPending} className="flex-1" data-testid="button-save-field">
                        <Save className="h-4 w-4 mr-2" />
                        {createFieldMutation.isPending ? 'Saving...' : 'Save Field'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
    </MainLayout>
  );
}
