import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import MetricsCard from "@/components/analytics/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  File, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();

  const { data: metrics } = useQuery({
    queryKey: ["/api/analytics/metrics"],
  });

  const { data: contractsData } = useQuery({
    queryKey: ["/api/contracts"],
  });

  const contracts = contractsData?.contracts || [];

  // Calculate analytics data
  const statusBreakdown = contracts.reduce((acc: any, contract: any) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {});

  const typeBreakdown = contracts.reduce((acc: any, contract: any) => {
    acc[contract.contractType] = (acc[contract.contractType] || 0) + 1;
    return acc;
  }, {});

  const avgProcessingTime = contracts
    .filter((c: any) => c.analysis?.processingTime)
    .reduce((sum: number, c: any) => sum + (c.analysis?.processingTime || 0), 0) / 
    contracts.filter((c: any) => c.analysis?.processingTime).length || 0;

  return (
    <MainLayout 
      title="Analytics" 
      description="Comprehensive insights into your contract portfolio"
    >
      <div className="space-y-6">
        {/* Time Period Selector */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select defaultValue="30days">
              <SelectTrigger className="w-[180px]" data-testid="select-time-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Contracts"
            value={metrics?.totalContracts || 0}
            icon={File}
            trend="+12%"
            trendLabel="from last period"
            data-testid="metric-total"
          />
          <MetricsCard
            title="Processing Time"
            value={`${Math.round(avgProcessingTime)}s`}
            icon={Clock}
            trend="-15%"
            trendLabel="average time"
            variant="processing"
            data-testid="metric-processing-time"
          />
          <MetricsCard
            title="Success Rate"
            value="98.2%"
            icon={CheckCircle}
            trend="+2.1%"
            trendLabel="this month"
            variant="success"
            data-testid="metric-success-rate"
          />
          <MetricsCard
            title="Active Users"
            value="24"
            icon={Users}
            trend="+8%"
            trendLabel="this month"
            data-testid="metric-active-users"
          />
        </div>

        {/* Charts and Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contract Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statusBreakdown).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={status === 'analyzed' ? 'default' : 
                                status === 'processing' ? 'secondary' : 'outline'}
                      >
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count} contracts</span>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / contracts.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contract Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Contract Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(typeBreakdown).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count}</span>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-chart-2 h-2 rounded-full" 
                          style={{ width: `${(count / contracts.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">High Risk</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Requires immediate attention</p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">3</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">Medium Risk</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Monitor closely</p>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">8</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Low Risk</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Standard compliance</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">15</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Processing Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Processing Time</span>
                  <span className="font-medium">{Math.round(avgProcessingTime)}s</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-600">98.2%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failed Processes</span>
                  <span className="font-medium text-red-600">
                    {statusBreakdown.failed || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Queue Length</span>
                  <span className="font-medium">
                    {statusBreakdown.processing || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.slice(0, 5).map((contract: any) => (
                  <div key={contract.id} className="flex items-center space-x-4 p-3 border-l-4 border-primary/20 bg-muted/20 rounded-r-lg">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium">{contract.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.status === 'analyzed' ? 'Analysis completed' : 
                         contract.status === 'processing' ? 'Processing started' : 
                         'Uploaded'}
                      </p>
                    </div>
                    <Badge variant="outline">{contract.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
