import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Layers, MapPin, Plus, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import type { Company, BusinessUnit, Location } from '@shared/schema';

type Status = 'A' | 'I' | 'D';

interface HierarchyNode {
  companies: (Company & { 
    businessUnits: (BusinessUnit & { 
      locations: Location[] 
    })[] 
  })[];
}

export default function MasterDataPage() {
  const [filterStatus, setFilterStatus] = useState<string>('A');
  const { toast } = useToast();

  const { data: hierarchy, isLoading } = useQuery<HierarchyNode>({
    queryKey: ['/api/master-data/hierarchy', filterStatus],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading master data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Master Data Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your organizational hierarchy
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Active Only</SelectItem>
                  <SelectItem value="I">Inactive Only</SelectItem>
                  <SelectItem value="all">All Records</SelectItem>
                </SelectContent>
              </Select>
              <AddCompanyButton />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Card className="p-6">
            {hierarchy?.companies && hierarchy.companies.length > 0 ? (
              <div className="space-y-2">
                {hierarchy.companies.map((company) => (
                  <CompanyNode key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first company
                </p>
                <AddCompanyButton />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function CompanyNode({ company }: { company: Company & { businessUnits: (BusinessUnit & { locations: Location[] })[] } }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddBU, setShowAddBU] = useState(false);

  return (
    <div className="group" data-testid={`company-node-${company.id}`}>
      <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 hover:bg-accent p-1 rounded"
          data-testid={`button-toggle-company-${company.id}`}
          aria-label={isExpanded ? 'Collapse company' : 'Expand company'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-primary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Building2 className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <CompanyEditForm 
              company={company} 
              onCancel={() => setIsEditing(false)} 
              onSaved={() => setIsEditing(false)} 
            />
          ) : (
            <div className="flex items-center gap-3">
              <span 
                className="font-semibold cursor-pointer hover:text-primary transition-colors" 
                onClick={() => setIsEditing(true)}
                data-testid={`text-company-name-${company.id}`}
              >
                {company.companyName}
              </span>
              <StatusBadge 
                status={company.status as Status} 
                entityType="company" 
                entityId={company.id} 
              />
            </div>
          )}
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddBU(!showAddBU)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-add-bu-${company.id}`}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Unit
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1 border-l-2 border-muted pl-4 space-y-1">
          {showAddBU && (
            <BusinessUnitForm 
              companyId={company.id} 
              onCancel={() => setShowAddBU(false)}
              onSaved={() => setShowAddBU(false)}
            />
          )}
          {company.businessUnits?.map((bu) => (
            <BusinessUnitNode key={bu.id} businessUnit={bu} companyId={company.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessUnitNode({ 
  businessUnit, 
  companyId 
}: { 
  businessUnit: BusinessUnit & { locations: Location[] }; 
  companyId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddLoc, setShowAddLoc] = useState(false);

  return (
    <div className="group" data-testid={`bu-node-${businessUnit.id}`}>
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 hover:bg-accent p-1 rounded"
          data-testid={`button-toggle-bu-${businessUnit.id}`}
          aria-label={isExpanded ? 'Collapse business unit' : 'Expand business unit'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-blue-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Layers className="h-4 w-4 text-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <BusinessUnitEditForm 
              businessUnit={businessUnit} 
              onCancel={() => setIsEditing(false)} 
              onSaved={() => setIsEditing(false)} 
            />
          ) : (
            <div className="flex items-center gap-2">
              <span 
                className="text-sm font-medium cursor-pointer hover:text-primary transition-colors" 
                onClick={() => setIsEditing(true)}
                data-testid={`text-bu-name-${businessUnit.id}`}
              >
                {businessUnit.orgName}
              </span>
              <StatusBadge 
                status={businessUnit.status as Status} 
                entityType="business_unit" 
                entityId={businessUnit.id} 
              />
            </div>
          )}
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddLoc(!showAddLoc)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-add-location-${businessUnit.id}`}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Location
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1 border-l-2 border-muted/50 pl-4 space-y-1">
          {showAddLoc && (
            <LocationForm 
              companyId={companyId}
              orgId={businessUnit.id} 
              onCancel={() => setShowAddLoc(false)}
              onSaved={() => setShowAddLoc(false)}
            />
          )}
          {businessUnit.locations?.map((loc) => (
            <LocationNode key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationNode({ location }: { location: Location }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-accent/20 transition-colors" data-testid={`location-node-${location.id}`}>
      <MapPin className="h-4 w-4 text-green-500 shrink-0 ml-6" />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <LocationEditForm 
            location={location} 
            onCancel={() => setIsEditing(false)} 
            onSaved={() => setIsEditing(false)} 
          />
        ) : (
          <div className="flex items-center gap-2">
            <span 
              className="text-sm cursor-pointer hover:text-primary transition-colors" 
              onClick={() => setIsEditing(true)}
              data-testid={`text-location-name-${location.id}`}
            >
              {location.locName}
            </span>
            <StatusBadge 
              status={location.status as Status} 
              entityType="location" 
              entityId={location.id} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ 
  status, 
  entityType, 
  entityId 
}: { 
  status: Status; 
  entityType: 'company' | 'business_unit' | 'location'; 
  entityId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (newStatus: Status) => {
      const endpoints = {
        company: '/api/master-data/companies',
        business_unit: '/api/master-data/business-units',
        location: '/api/master-data/locations',
      };
      return apiRequest('PATCH', `${endpoints[entityType]}/${entityId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Status updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update status', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const statusConfig = {
    A: { label: 'Active', className: 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20' },
    I: { label: 'Inactive', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20' },
    D: { label: 'Deleted', className: 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20' },
  };

  const config = statusConfig[status];

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Select 
          value={status} 
          onValueChange={(val) => updateMutation.mutate(val as Status)}
          data-testid={`select-status-${entityType}-${entityId}`}
        >
          <SelectTrigger className="h-6 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Active</SelectItem>
            <SelectItem value="I">Inactive</SelectItem>
            <SelectItem value="D">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Badge 
      className={`text-xs cursor-pointer ${config.className}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      data-testid={`badge-status-${entityType}-${entityId}`}
    >
      {config.label}
    </Badge>
  );
}

function AddCompanyButton() {
  const [isAdding, setIsAdding] = useState(false);

  if (isAdding) {
    return (
      <CompanyForm 
        onCancel={() => setIsAdding(false)} 
        onSaved={() => setIsAdding(false)} 
      />
    );
  }

  return (
    <Button onClick={() => setIsAdding(true)} data-testid="button-add-company">
      <Plus className="h-4 w-4 mr-2" />
      Add Company
    </Button>
  );
}

function CompanyForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: { companyName: string }) => 
      apiRequest('POST', '/api/master-data/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Company created successfully' });
      onSaved();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create company', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ companyName: name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-accent/30 rounded-lg">
      <Building2 className="h-5 w-5 text-primary" />
      <Input
        placeholder="Company name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1"
        autoFocus
        data-testid="input-company-name"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || createMutation.isPending} data-testid="button-save-company">
        <Check className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-company">
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}

function CompanyEditForm({ company, onCancel, onSaved }: { company: Company; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(company.companyName);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: { companyName: string }) => 
      apiRequest('PATCH', `/api/master-data/companies/${company.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Company updated successfully' });
      onSaved();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update company', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate({ companyName: name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Input
        placeholder="Company name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1"
        autoFocus
        data-testid="input-edit-company-name"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || updateMutation.isPending} data-testid="button-update-company">
        <Check className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-edit-company">
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}

function BusinessUnitForm({ companyId, onCancel, onSaved }: { companyId: string; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: { orgName: string; companyId: string }) => 
      apiRequest('POST', '/api/master-data/business-units', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Business unit created successfully' });
      onSaved();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create business unit', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ orgName: name, companyId });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-accent/20 rounded-lg mb-1">
      <Layers className="h-4 w-4 text-blue-500" />
      <Input
        placeholder="Business unit name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 h-8 text-sm"
        autoFocus
        data-testid="input-bu-name"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || createMutation.isPending} data-testid="button-save-bu">
        <Check className="h-3 w-3" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-bu">
        <X className="h-3 w-3" />
      </Button>
    </form>
  );
}

function BusinessUnitEditForm({ businessUnit, onCancel, onSaved }: { businessUnit: BusinessUnit; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(businessUnit.orgName);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: { orgName: string }) => 
      apiRequest('PATCH', `/api/master-data/business-units/${businessUnit.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Business unit updated successfully' });
      onSaved();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update business unit', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate({ orgName: name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Input
        placeholder="Business unit name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 h-8 text-sm"
        autoFocus
        data-testid="input-edit-bu-name"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || updateMutation.isPending} data-testid="button-update-bu">
        <Check className="h-3 w-3" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-edit-bu">
        <X className="h-3 w-3" />
      </Button>
    </form>
  );
}

function LocationForm({ companyId, orgId, onCancel, onSaved }: { companyId: string; orgId: string; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: { locName: string; companyId: string; orgId: string }) => 
      apiRequest('POST', '/api/master-data/locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Location created successfully' });
      onSaved();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create location', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ locName: name, companyId, orgId });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg mb-1">
      <MapPin className="h-4 w-4 text-green-500" />
      <Input
        placeholder="Location name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 h-8 text-sm"
        autoFocus
        data-testid="input-location-name"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || createMutation.isPending} data-testid="button-save-location">
        <Check className="h-3 w-3" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-location">
        <X className="h-3 w-3" />
      </Button>
    </form>
  );
}

function LocationEditForm({ location, onCancel, onSaved }: { location: Location; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(location.locName);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: { locName: string }) => 
      apiRequest('PATCH', `/api/master-data/locations/${location.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-data/hierarchy'] });
      toast({ title: 'Location updated successfully' });
      onSaved();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update location', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate({ locName: name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Input
        placeholder="Location name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 h-8 text-sm"
        autoFocus
        data-testid="input-edit-location-name"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || updateMutation.isPending} data-testid="button-update-location">
        <Check className="h-3 w-3" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-edit-location">
        <X className="h-3 w-3" />
      </Button>
    </form>
  );
}
