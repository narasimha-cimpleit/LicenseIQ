import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'processing' | 'revenue';
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className,
}: MetricsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-green-500/10',
          iconColor: 'text-green-500',
        };
      case 'processing':
        return {
          iconBg: 'bg-chart-2/10',
          iconColor: 'text-chart-2',
        };
      case 'revenue':
        return {
          iconBg: 'bg-chart-4/10',
          iconColor: 'text-chart-4',
        };
      default:
        return {
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
        };
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.includes('+') || trend === 'Real-time') return 'text-green-600';
    if (trend.includes('-')) return 'text-red-600';
    return 'text-blue-600';
  };

  const variantStyles = getVariantStyles();

  return (
    <Card className={cn("card-hover", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", variantStyles.iconBg)}>
            <Icon className={cn("h-6 w-6", variantStyles.iconColor)} />
          </div>
        </div>
        {(trend || trendLabel) && (
          <div className="mt-4 flex items-center">
            {trend && (
              <Badge variant="outline" className={cn("text-sm font-medium", getTrendColor())}>
                {trend}
              </Badge>
            )}
            {trendLabel && (
              <span className="text-muted-foreground text-sm ml-2">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
