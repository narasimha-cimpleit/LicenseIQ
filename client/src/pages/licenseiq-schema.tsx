import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Database,
  FileText,
  DollarSign,
  ShoppingCart,
  Package,
  Search,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

interface LicenseiqEntity {
  id: string;
  name: string;
  technicalName: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface LicenseiqField {
  id: string;
  entityId: string;
  fieldName: string;
  dataType: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
  validationRules?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Organization Hierarchy": "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100",
  "Master Data": "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
  "Transactions": "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
  "Transactional": "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
  "Rules": "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100",
};

const ENTITY_ICONS: Record<string, typeof Database> = {
  sales_data: ShoppingCart,
  contract_terms: FileText,
  royalty_rules: DollarSign,
  payments: DollarSign,
  products: Package,
};

const DATA_TYPES = [
  "string",
  "number",
  "date",
  "boolean",
  "object",
  "array",
];

export default function LicenseIQSchema() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("entities");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<LicenseiqEntity | null>(null);
  
  // Entity inline form states
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [entityDialogMode, setEntityDialogMode] = useState<"create" | "edit">("create");
  const [entityForm, setEntityForm] = useState({
    name: "",
    technicalName: "",
    description: "",
    category: "",
  });

  // Field inline form states
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldDialogMode, setFieldDialogMode] = useState<"create" | "edit">("create");
  const [fieldForm, setFieldForm] = useState({
    id: "",
    fieldName: "",
    dataType: "",
    description: "",
    isRequired: false,
    defaultValue: "",
    validationRules: "",
  });

  // Fetch entities
  const { data: entitiesData, isLoading: entitiesLoading } = useQuery<{ entities: LicenseiqEntity[] }>({
    queryKey: ["/api/licenseiq-entities", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      const response = await fetch(`/api/licenseiq-entities?${params}`);
      if (!response.ok) throw new Error("Failed to fetch entities");
      return response.json();
    },
  });

  // Fetch fields for selected entity
  const { data: fieldsData, isLoading: fieldsLoading } = useQuery<{ fields: LicenseiqField[] }>({
    queryKey: ["/api/licenseiq-fields", selectedEntity?.id],
    enabled: !!selectedEntity,
    queryFn: async () => {
      const response = await fetch(`/api/licenseiq-fields?entityId=${selectedEntity?.id}`);
      if (!response.ok) throw new Error("Failed to fetch fields");
      return response.json();
    },
  });

  // Entity mutations
  const createEntityMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/licenseiq-entities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/licenseiq-entities" });
      toast({ title: "Entity created successfully!" });
      setShowEntityForm(false);
      resetEntityForm();
    },
    onError: () => {
      toast({ title: "Failed to create entity", variant: "destructive" });
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/licenseiq-entities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/licenseiq-entities" });
      toast({ title: "Entity updated successfully!" });
      setShowEntityForm(false);
      resetEntityForm();
    },
    onError: () => {
      toast({ title: "Failed to update entity", variant: "destructive" });
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/licenseiq-entities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/licenseiq-entities" });
      toast({ title: "Entity deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete entity", variant: "destructive" });
    },
  });

  // Field mutations
  const createFieldMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/licenseiq-fields", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/licenseiq-fields" });
      toast({ title: "Field created successfully!" });
      setShowFieldForm(false);
      resetFieldForm();
    },
    onError: () => {
      toast({ title: "Failed to create field", variant: "destructive" });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/licenseiq-fields/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/licenseiq-fields" });
      toast({ title: "Field updated successfully!" });
      setShowFieldForm(false);
      resetFieldForm();
    },
    onError: () => {
      toast({ title: "Failed to update field", variant: "destructive" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/licenseiq-fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/licenseiq-fields" });
      toast({ title: "Field deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete field", variant: "destructive" });
    },
  });

  const resetEntityForm = () => {
    setEntityForm({ name: "", technicalName: "", description: "", category: "" });
  };

  const resetFieldForm = () => {
    setFieldForm({
      id: "",
      fieldName: "",
      dataType: "",
      description: "",
      isRequired: false,
      defaultValue: "",
      validationRules: "",
    });
  };

  const handleCreateEntity = () => {
    setEntityDialogMode("create");
    resetEntityForm();
    setShowEntityForm(true);
  };

  const handleEditEntity = (entity: LicenseiqEntity) => {
    setEntityDialogMode("edit");
    setEntityForm({
      name: entity.name,
      technicalName: entity.technicalName,
      description: entity.description || "",
      category: entity.category || "",
    });
    setSelectedEntity(entity);
    setShowEntityForm(true);
  };

  const handleSaveEntity = () => {
    if (entityDialogMode === "create") {
      createEntityMutation.mutate(entityForm);
    } else if (selectedEntity) {
      updateEntityMutation.mutate({ id: selectedEntity.id, data: entityForm });
    }
  };

  const handleCreateField = () => {
    if (!selectedEntity) {
      toast({ title: "Please select an entity first", variant: "destructive" });
      return;
    }
    setFieldDialogMode("create");
    resetFieldForm();
    setShowFieldForm(true);
  };

  const handleEditField = (field: LicenseiqField) => {
    setFieldDialogMode("edit");
    setFieldForm({
      id: field.id,
      fieldName: field.fieldName,
      dataType: field.dataType,
      description: field.description || "",
      isRequired: field.isRequired,
      defaultValue: field.defaultValue || "",
      validationRules: field.validationRules || "",
    });
    setShowFieldForm(true);
  };

  const handleSaveField = () => {
    const fieldData = {
      entityId: selectedEntity?.id,
      ...fieldForm,
    };

    if (fieldDialogMode === "create") {
      createFieldMutation.mutate(fieldData);
    } else {
      updateFieldMutation.mutate({ id: fieldForm.id, data: fieldData });
    }
  };

  const filteredEntities = entitiesData?.entities.filter((entity) =>
    entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.technicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredFields = fieldsData?.fields.filter((field) =>
    field.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <MainLayout
      title="LicenseIQ Schema Catalog"
      description="Define and manage your platform's standard data entities and fields"
    >
      <div className="space-y-6">
        {/* Category filter and search */}
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entities or fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800"
                data-testid="input-search-schema"
              />
            </div>
            {activeTab === "entities" && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-800" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Master Data">Master Data</SelectItem>
                  <SelectItem value="Transactional">Transactional</SelectItem>
                  <SelectItem value="Rules">Rules</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 p-1 shadow-sm">
            <TabsTrigger value="entities" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white" data-testid="tab-entities">
              <Database className="h-4 w-4 mr-2" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="fields" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white" data-testid="tab-fields">
              <FileText className="h-4 w-4 mr-2" />
              Fields
            </TabsTrigger>
          </TabsList>

          {/* Entities Tab */}
          <TabsContent value="entities" className="space-y-6">
            {/* Inline Entity Form */}
            {showEntityForm && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{entityDialogMode === "create" ? "Create New Entity" : "Edit Entity"}</span>
                    <Button variant="ghost" size="sm" onClick={() => {setShowEntityForm(false); resetEntityForm();}} data-testid="button-close-entity-form">
                      ✕
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Define a new data entity in your LicenseIQ platform schema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="entity-name">Entity Name*</Label>
                    <Input
                      id="entity-name"
                      placeholder="e.g., Sales Data"
                      value={entityForm.name}
                      onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
                      data-testid="input-entity-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entity-technical-name">Technical Name*</Label>
                    <Input
                      id="entity-technical-name"
                      placeholder="e.g., sales_data"
                      value={entityForm.technicalName}
                      onChange={(e) => setEntityForm({ ...entityForm, technicalName: e.target.value })}
                      data-testid="input-entity-technical-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entity-category">Category</Label>
                    <Select value={entityForm.category} onValueChange={(value) => setEntityForm({ ...entityForm, category: value })}>
                      <SelectTrigger data-testid="select-entity-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Master Data">Master Data</SelectItem>
                        <SelectItem value="Transactional">Transactional</SelectItem>
                        <SelectItem value="Rules">Rules</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entity-description">Description</Label>
                    <Textarea
                      id="entity-description"
                      placeholder="Describe this entity's purpose..."
                      value={entityForm.description}
                      onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })}
                      rows={3}
                      data-testid="textarea-entity-description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {setShowEntityForm(false); resetEntityForm();}} data-testid="button-cancel-entity" className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEntity} data-testid="button-save-entity" className="flex-1">
                      {entityDialogMode === "create" ? "Create Entity" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredEntities.length} {filteredEntities.length === 1 ? "entity" : "entities"} found
              </p>
              <Button onClick={handleCreateEntity} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" data-testid="button-create-entity">
                <Plus className="h-4 w-4 mr-2" />
                Create Entity
              </Button>
            </div>

            {entitiesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading entities...</p>
              </div>
            ) : filteredEntities.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    {searchQuery || (selectedCategory && selectedCategory !== "all") ? "No entities match your filters" : "No entities defined yet"}
                  </p>
                  {!searchQuery && (!selectedCategory || selectedCategory === "all") && (
                    <Button onClick={handleCreateEntity} className="mt-4" variant="outline" data-testid="button-create-first-entity">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Entity
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntities.map((entity) => {
                  const Icon = ENTITY_ICONS[entity.technicalName] || Database;
                  return (
                    <Card
                      key={entity.id}
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        setSelectedEntity(entity);
                        setActiveTab("fields");
                      }}
                      data-testid={`card-entity-${entity.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg group-hover:scale-110 transition-transform">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{entity.name}</CardTitle>
                              <code className="text-xs text-gray-500 dark:text-gray-400">
                                {entity.technicalName}
                              </code>
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditEntity(entity)}
                              data-testid={`button-edit-entity-${entity.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteEntityMutation.mutate(entity.id)}
                              data-testid={`button-delete-entity-${entity.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {entity.category && (
                          <Badge className={`w-fit mt-2 ${CATEGORY_COLORS[entity.category] || ""}`}>
                            {entity.category}
                          </Badge>
                        )}
                      </CardHeader>
                      {entity.description && (
                        <CardContent>
                          <CardDescription className="text-sm">
                            {entity.description}
                          </CardDescription>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-6">
            {!selectedEntity ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Select an entity to view and manage its fields
                  </p>
                  <Button onClick={() => setActiveTab("entities")} className="mt-4" variant="outline" data-testid="button-select-entity">
                    <Database className="h-4 w-4 mr-2" />
                    Browse Entities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg">
                      {(() => {
                        const Icon = ENTITY_ICONS[selectedEntity.technicalName] || Database;
                        return <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedEntity.name}</h3>
                      <code className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedEntity.technicalName}
                      </code>
                    </div>
                  </div>
                  <Button onClick={handleCreateField} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" data-testid="button-create-field">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {/* Inline Field Form */}
                {showFieldForm && (
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{fieldDialogMode === "create" ? "Add New Field" : "Edit Field"}</span>
                        <Button variant="ghost" size="sm" onClick={() => {setShowFieldForm(false); resetFieldForm();}} data-testid="button-close-field-form">
                          ✕
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Define a field for {selectedEntity.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="field-name">Field Name*</Label>
                        <Input
                          id="field-name"
                          placeholder="e.g., transactionId"
                          value={fieldForm.fieldName}
                          onChange={(e) => setFieldForm({ ...fieldForm, fieldName: e.target.value })}
                          data-testid="input-field-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="field-data-type">Data Type*</Label>
                        <Select value={fieldForm.dataType} onValueChange={(value) => setFieldForm({ ...fieldForm, dataType: value })}>
                          <SelectTrigger data-testid="select-field-data-type">
                            <SelectValue placeholder="Select data type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="field-description">Description</Label>
                        <Textarea
                          id="field-description"
                          placeholder="Describe this field's purpose..."
                          value={fieldForm.description}
                          onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                          rows={2}
                          data-testid="textarea-field-description"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="field-required"
                          checked={fieldForm.isRequired}
                          onChange={(e) => setFieldForm({ ...fieldForm, isRequired: e.target.checked })}
                          className="rounded border-gray-300"
                          data-testid="checkbox-field-required"
                        />
                        <Label htmlFor="field-required" className="cursor-pointer">
                          Required field
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {setShowFieldForm(false); resetFieldForm();}} data-testid="button-cancel-field" className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveField} data-testid="button-save-field" className="flex-1">
                          {fieldDialogMode === "create" ? "Add Field" : "Save Changes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {fieldsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading fields...</p>
                  </div>
                ) : filteredFields.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-center">
                        {searchQuery ? "No fields match your search" : "No fields defined for this entity yet"}
                      </p>
                      {!searchQuery && (
                        <Button onClick={handleCreateField} className="mt-4" variant="outline" data-testid="button-create-first-field">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Field
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field Name</TableHead>
                            <TableHead>Data Type</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFields.map((field) => (
                            <TableRow key={field.id} data-testid={`row-field-${field.id}`}>
                              <TableCell className="font-mono font-medium">{field.fieldName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.dataType}</Badge>
                              </TableCell>
                              <TableCell>
                                {field.isRequired ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <span className="text-gray-400">Optional</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                                {field.description || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditField(field)}
                                    data-testid={`button-edit-field-${field.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteFieldMutation.mutate(field.id)}
                                    data-testid={`button-delete-field-${field.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
