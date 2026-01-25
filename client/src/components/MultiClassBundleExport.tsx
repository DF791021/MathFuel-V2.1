import { useState } from "react";
import { trpc } from "@/lib/trpc";
import MultiClassSelector from "./MultiClassSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, FileText, Loader2, Calendar, Package } from "lucide-react";

export default function MultiClassBundleExport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [bundleTitle, setBundleTitle] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeTestimonials, setIncludeTestimonials] = useState(true);
  const [includeTips, setIncludeTips] = useState(true);
  const [dateRangeType, setDateRangeType] = useState<"all" | "month" | "quarter" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [organizationMethod, setOrganizationMethod] = useState<"by-class" | "by-goal" | "chronological">("by-class");
  const [primaryColor, setPrimaryColor] = useState("#2d5a2d");
  const [secondaryColor, setSecondaryColor] = useState("#4a7c4a");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const exportMutation = trpc.pdfExport.generateMultiClassBundle.useMutation({
    onSuccess: (data) => {
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Multi-class bundle exported successfully!");
      setIsOpen(false);
      setIsExporting(false);
      setSelectedClassIds([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export bundle");
      setIsExporting(false);
    },
  });

  const handleExport = async () => {
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    if (!schoolName.trim()) {
      toast.error("Please enter your school name");
      return;
    }

    setIsExporting(true);

    let dateRange: { startDate: Date; endDate: Date } | undefined;

    if (dateRangeType === "month") {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateRange = { startDate: monthAgo, endDate: now };
    } else if (dateRangeType === "quarter") {
      const now = new Date();
      const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      dateRange = { startDate: quarterAgo, endDate: now };
    } else if (dateRangeType === "custom") {
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates");
        setIsExporting(false);
        return;
      }
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };
    }

    exportMutation.mutate({
      classIds: selectedClassIds,
      bundleTitle: bundleTitle || undefined,
      dateRange,
      includeMetrics,
      includeTestimonials,
      includeTips,
      schoolName,
      teacherNotes: teacherNotes || undefined,
      organizationMethod,
      primaryColor: showAdvanced ? primaryColor : undefined,
      secondaryColor: showAdvanced ? secondaryColor : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="default">
          <Package className="h-4 w-4" />
          Bundle Multiple Classes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Multi-Class Success Stories Bundle</DialogTitle>
          <DialogDescription>
            Combine success stories from multiple classes into a single professional PDF report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Selection */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Step 1: Select Classes</h3>
            <MultiClassSelector
              selectedClassIds={selectedClassIds}
              onSelectionChange={setSelectedClassIds}
            />
          </div>

          {selectedClassIds.length > 0 && (
            <>
              {/* Bundle Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Step 2: Bundle Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bundleTitle">Bundle Title (Optional)</Label>
                    <Input
                      id="bundleTitle"
                      placeholder="e.g., Grade 3 Success Stories - Q1 2024"
                      value={bundleTitle}
                      onChange={(e) => setBundleTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organizationMethod">Organization Method</Label>
                    <Select value={organizationMethod} onValueChange={(value: any) => setOrganizationMethod(value)}>
                      <SelectTrigger id="organizationMethod" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="by-class">Group by Class</SelectItem>
                        <SelectItem value="by-goal">Group by Goal Type</SelectItem>
                        <SelectItem value="chronological">Chronological Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* School Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Step 3: School Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      placeholder="Enter your school name"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date Range Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Step 4: Date Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dateRange">Select Period</Label>
                    <Select value={dateRangeType} onValueChange={(value: any) => setDateRangeType(value)}>
                      <SelectTrigger id="dateRange" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stories</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last 3 Months</SelectItem>
                        <SelectItem value="custom">Custom Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateRangeType === "custom" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Report Content Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Step 5: Report Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="metrics"
                      checked={includeMetrics}
                      onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                    />
                    <Label htmlFor="metrics" className="cursor-pointer">
                      Include Engagement Metrics
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="testimonials"
                      checked={includeTestimonials}
                      onCheckedChange={(checked) => setIncludeTestimonials(checked as boolean)}
                    />
                    <Label htmlFor="testimonials" className="cursor-pointer">
                      Include Student Testimonials
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tips"
                      checked={includeTips}
                      onCheckedChange={(checked) => setIncludeTips(checked as boolean)}
                    />
                    <Label htmlFor="tips" className="cursor-pointer">
                      Include Success Tips
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Teacher Notes (Optional)</CardTitle>
                  <CardDescription>Add commentary for parents</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Share insights about your classes' achievements..."
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    className="min-h-20"
                  />
                </CardContent>
              </Card>

              {/* Advanced Customization */}
              <Card>
                <CardHeader>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full hover:opacity-70 transition-opacity"
                  >
                    <CardTitle className="text-base">Advanced Customization</CardTitle>
                    <span className="text-sm text-gray-500">{showAdvanced ? "▼" : "▶"}</span>
                  </button>
                </CardHeader>
                {showAdvanced && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <input
                            id="primaryColor"
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#2d5a2d"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <input
                            id="secondaryColor"
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            placeholder="#4a7c4a"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                      <p className="font-medium mb-2">Color Preview:</p>
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 rounded text-white text-center" style={{ backgroundColor: primaryColor }}>
                          Primary
                        </div>
                        <div className="flex-1 p-3 rounded text-white text-center" style={{ backgroundColor: secondaryColor }}>
                          Secondary
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Bundle Preview Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium">Your bundle will include:</p>
                      <ul className="mt-2 space-y-1 text-xs ml-4 list-disc">
                        <li>Professional cover page with school branding</li>
                        <li>Table of contents with class listings</li>
                        <li>Executive summary with aggregate statistics</li>
                        <li>Stories organized {organizationMethod === "by-class" ? "by class" : organizationMethod === "by-goal" ? "by goal type" : "chronologically"}</li>
                        {includeMetrics && <li>Detailed engagement metrics across all classes</li>}
                        {teacherNotes && <li>Your personal teacher notes</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedClassIds.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Bundle...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Bundle
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
