import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SalesUpload() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await apiRequest("POST", "/api/sales/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast({
        title: "Upload Successful",
        description: `Imported ${data.validRows || 0} sales transactions. AI matching in progress...`,
      });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExt)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV or Excel file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate();
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('/api/sales/sample-data', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download sample data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_sales_data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Sample Data Downloaded",
        description: "You can now upload this file to test the system.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download sample data",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout
      title="Import Sales Data"
      description="Upload sales transactions for AI-driven royalty calculations"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Sales Data
            </CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing sales transactions. The system will automatically match each sale to contracts using AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Columns Info */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Required Columns:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>transactionDate</strong> - Date of sale (YYYY-MM-DD)</li>
                <li>• <strong>grossAmount</strong> - Sale amount (number)</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Optional Columns:</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• <strong>transactionId</strong> - Unique transaction ID</li>
                <li>• <strong>productName</strong> - Product or service name</li>
                <li>• <strong>productCode</strong> - SKU or product code</li>
                <li>• <strong>category</strong> - Product category</li>
                <li>• <strong>territory</strong> - Sales region/territory</li>
                <li>• <strong>currency</strong> - Currency code (default: USD)</li>
                <li>• <strong>netAmount</strong> - Net sale amount after deductions</li>
                <li>• <strong>quantity</strong> - Units sold</li>
                <li>• <strong>unitPrice</strong> - Price per unit</li>
              </ul>
            </div>

            {/* Sample Data Download */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Need Sample Data?
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Download our sample CSV file with 15 plant variety sales transactions. Perfect for testing!
                  </p>
                </div>
                <Button
                  onClick={handleDownloadSample}
                  variant="outline"
                  className="ml-4 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
                  data-testid="button-download-sample"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="sales-file">Select File</Label>
              <Input
                id="sales-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
                data-testid="input-sales-file"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full"
              data-testid="button-upload-sales"
            >
              {uploadMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                  <p className="text-2xl font-bold">{uploadResult.totalRows || 0}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Valid</p>
                  <p className="text-2xl font-bold text-green-600">{uploadResult.validRows || 0}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Invalid</p>
                  <p className="text-2xl font-bold text-orange-600">{uploadResult.invalidRows || 0}</p>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    {uploadResult.errors.map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Next Step:</strong> The system is now matching sales to contracts using AI. 
                  Go to the Contracts page to see matched sales and calculate royalties.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
