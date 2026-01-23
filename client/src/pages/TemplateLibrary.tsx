import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Star, User, Clock, Zap, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TemplateCardProps {
  template: {
    id: number;
    title: string;
    description: string | null;
    category: string;
    tags: string | null;
    usageCount: number;
    rating: number | null;
    template: {
      subject: string;
      body: string;
    };
    creator: {
      name: string | null;
      email: string | null;
    };
  };
  onImport: (templateId: number, title: string) => void;
  isImporting: boolean;
}

function TemplateCard({ template, onImport, isImporting }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const tags = template.tags ? template.tags.split(",").map(t => t.trim()) : [];

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{template.description}</CardDescription>
            </div>
            <Badge variant="outline" className="flex-shrink-0">{template.category}</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Creator Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{template.creator.name}</span>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{template.usageCount} imports</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{(template.rating ?? 0).toFixed(1)}</span>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Subject Preview */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-1">Subject:</p>
            <p className="text-sm line-clamp-2 text-gray-700">{template.template.subject}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowPreview(true)}
            >
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onImport(template.id, template.title)}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template.title}</DialogTitle>
            <DialogDescription>
              By {template.creator.name || "Unknown"} • {template.usageCount} imports • ⭐ {(template.rating ?? 0).toFixed(1)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Subject Line</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-sm text-gray-700">{template.template.subject}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Email Body</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.template.body}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Description</h3>
              <p className="text-sm text-gray-700">{template.description}</p>
            </div>

            {template.tags && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.split(",").map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => {
              onImport(template.id, template.title);
              setShowPreview(false);
            }} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TemplateLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [importingTemplateId, setImportingTemplateId] = useState<number | null>(null);

  const itemsPerPage = 12;

  // Fetch public templates
  const { data: templates = [], isLoading } = trpc.emailTemplates.getPublicTemplates.useQuery(
    { category: selectedCategory }
  );

  // Import template mutation
  const importMutation = trpc.emailTemplates.importTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Template imported successfully! Template ID: ${data.newTemplateId}`);
      setImportingTemplateId(null);
    },
    onError: (error) => {
      toast.error(`Failed to import template: ${error.message}`);
      setImportingTemplateId(null);
    },
  });

  // Filter and search
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "newest") {
      // Sort by usage count as newest indicator
      result = [...result].sort((a, b) => b.usageCount - a.usageCount);
    } else {
      result = [...result].sort((a, b) => b.usageCount - a.usageCount);
    }

    return result;
  }, [templates, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [templates]);

  const handleImport = async (templateId: number, title: string) => {
    setImportingTemplateId(templateId);
    await importMutation.mutateAsync({
      originalTemplateId: templateId,
      newTemplateName: `${title} (Imported)`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Template Library</h1>
          <p className="text-lg text-gray-600">Discover and import email templates from the community</p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Search Bar */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as "popular" | "rating" | "newest");
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === undefined ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCategory(undefined);
                    setCurrentPage(1);
                  }}
                >
                  All Categories
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Templates Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paginatedTemplates.length === 0 ? (
              <Card className="text-center py-12">
                <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "No templates available in this category yet"}
                </p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onImport={handleImport}
                      isImporting={importingTemplateId === template.id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{templates.length}</p>
              <p className="text-gray-600">Templates Available</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{categories.length}</p>
              <p className="text-gray-600">Categories</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </p>
              <p className="text-gray-600">Total Imports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
