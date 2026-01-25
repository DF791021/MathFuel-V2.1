import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";

interface MultiClassSelectorProps {
  selectedClassIds: number[];
  onSelectionChange: (classIds: number[]) => void;
  onPreviewClick?: (classIds: number[]) => void;
}

export default function MultiClassSelector({
  selectedClassIds,
  onSelectionChange,
  onPreviewClick,
}: MultiClassSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stories">("name");

  // Fetch all classes for this teacher
  const { data: classes, isLoading } = trpc.pdfExport.getClassesForBundling.useQuery();

  // Filter and sort classes
  const filteredClasses = useMemo(() => {
    if (!classes) return [];

    let filtered = classes.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === "stories") {
      filtered.sort((a, b) => (b.storyCount || 0) - (a.storyCount || 0));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [classes, searchTerm, sortBy]);

  const handleToggleClass = (classId: number) => {
    if (selectedClassIds.includes(classId)) {
      onSelectionChange(selectedClassIds.filter((id) => id !== classId));
    } else {
      onSelectionChange([...selectedClassIds, classId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedClassIds.length === filteredClasses.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredClasses.map((c) => c.id));
    }
  };

  const totalStories = useMemo(() => {
    if (!classes) return 0;
    return selectedClassIds.reduce((sum, classId) => {
      const classData = classes.find((c) => c.id === classId);
      return sum + (classData?.storyCount || 0);
    }, 0);
  }, [classes, selectedClassIds]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading classes...</div>
        </CardContent>
      </Card>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium">No classes available</p>
              <p className="mt-1">Create or join a class to bundle success stories.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Select Classes to Bundle</CardTitle>
              <CardDescription>Choose one or more classes to include in your report</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{selectedClassIds.length}</div>
              <div className="text-xs text-gray-500">classes selected</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and sort controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("name")}
          >
            Sort by Name
          </Button>
          <Button
            variant={sortBy === "stories" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("stories")}
          >
            Sort by Stories
          </Button>
        </div>
      </div>

      {/* Select all / Deselect all */}
      {filteredClasses.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
          <Checkbox
            id="selectAll"
            checked={selectedClassIds.length === filteredClasses.length && filteredClasses.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="selectAll" className="cursor-pointer font-medium">
            {selectedClassIds.length === filteredClasses.length && filteredClasses.length > 0
              ? "Deselect All"
              : "Select All"}
          </Label>
        </div>
      )}

      {/* Class list */}
      <div className="space-y-2">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 text-sm">
                No classes match your search
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((classData) => (
            <Card
              key={classData.id}
              className={`cursor-pointer transition-colors ${
                selectedClassIds.includes(classData.id)
                  ? "border-green-500 bg-green-50"
                  : "hover:border-gray-400"
              }`}
              onClick={() => handleToggleClass(classData.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedClassIds.includes(classData.id)}
                    onCheckedChange={() => handleToggleClass(classData.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{classData.name}</span>
                      {selectedClassIds.includes(classData.id) && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {classData.storyCount} success {classData.storyCount === 1 ? "story" : "stories"}
                    </div>
                  </div>
                  <Badge variant="secondary">{classData.storyCount}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary statistics */}
      {selectedClassIds.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{selectedClassIds.length}</div>
                <div className="text-xs text-blue-900">Classes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalStories}</div>
                <div className="text-xs text-blue-900">Total Stories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(totalStories / Math.max(selectedClassIds.length, 1))}
                </div>
                <div className="text-xs text-blue-900">Avg per Class</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview button */}
      {selectedClassIds.length > 0 && onPreviewClick && (
        <Button onClick={() => onPreviewClick(selectedClassIds)} variant="outline" className="w-full">
          Preview Stories
        </Button>
      )}
    </div>
  );
}
