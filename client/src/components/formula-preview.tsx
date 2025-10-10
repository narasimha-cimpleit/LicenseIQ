import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormulaPreviewProps {
  contractId: string;
}

export function FormulaPreview({ contractId }: FormulaPreviewProps) {
  const { data: preview, isLoading, error } = useQuery({
    queryKey: [`/api/contracts/${contractId}/formula-preview`],
    enabled: !!contractId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Formula Preview
          </CardTitle>
          <CardDescription>Loading formula preview...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load formula preview. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!preview || preview.totalProducts === 0) {
    return null;
  }

  const matchedSamples = preview.samples.filter((s: any) => s.matched);
  const unmatchedSamples = preview.samples.filter((s: any) => !s.matched);

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌱 Formula Preview ({preview.totalProducts} Products)
        </CardTitle>
        <CardDescription>
          Formulas that will be applied to your sales data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {preview.totalRules}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Rules</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {matchedSamples.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Matched Products</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {preview.unmatchedSales}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unmatched</div>
          </div>
        </div>

        {/* Matched Products */}
        {matchedSamples.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Sample Products & Formulas
            </h4>
            <div className="space-y-2">
              {matchedSamples.map((sample: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-start justify-between"
                  data-testid={`formula-preview-${idx}`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{sample.productName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {sample.category} • {sample.sampleUnits} units
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {sample.formulaType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {sample.ruleName}
                    </div>
                    {sample.confidence && (
                      <div className="text-xs text-gray-500">
                        {Math.round(sample.confidence * 100)}% confident
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched Warning */}
        {preview.unmatchedSales > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {preview.unmatchedSales} product{preview.unmatchedSales > 1 ? 's' : ''} will not generate royalties (no matching rules found)
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
