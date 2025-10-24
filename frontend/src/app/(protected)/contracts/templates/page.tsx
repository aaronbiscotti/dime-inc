"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getContractTemplates, createContractFromTemplate } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText,
  Plus,
  Edit,
  Eye,
  Trash2,
  Download,
  Search,
  Filter
} from "lucide-react";

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  template_content: string;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by?: string | null;
  is_active?: boolean | null;
  template_variables?: any;
}

export default function ContractTemplatesPage() {
  const { user, clientProfile } = useAuth();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const categories = [
    "Influencer Agreement",
    "Brand Partnership",
    "Content Creation",
    "Sponsored Post",
    "Campaign Contract",
    "General"
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const result = await getContractTemplates();
      if (result.ok) {
        setTemplates(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: ContractTemplate) => {
    // This would typically redirect to a contract creation page with the template pre-filled
    console.log("Using template:", template);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
            <p className="text-gray-600 mt-1">Choose from pre-built contract templates</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#f5d82e] hover:bg-[#e5c820] text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Templates</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {template.description || "No description available"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}</span>
                  <span>{template.template_content.length} characters</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search criteria" 
                : "Create your first contract template"
              }
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#f5d82e] hover:bg-[#e5c820] text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        )}

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUseTemplate(selectedTemplate)}
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{selectedTemplate.description || "No description available"}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Category: {selectedTemplate.category || 'Uncategorized'}</span>
                  <span>Created: {selectedTemplate.created_at ? new Date(selectedTemplate.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Template Content:</h4>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                  {selectedTemplate.template_content}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Template</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <Input placeholder="Enter template name" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Input placeholder="Enter template description" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Content</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                    placeholder="Enter template content with placeholders like [CLIENT_NAME], [CREATOR_NAME], etc."
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="bg-[#f5d82e] hover:bg-[#e5c820] text-black">
                    Create Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
