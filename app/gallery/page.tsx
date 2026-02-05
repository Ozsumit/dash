"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Search, ImageIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full rounded-md bg-gray-100 animate-pulse" />
  ),
});

type GalleryItem = {
  id: number;
  title: string;
  imageUrl: string;
  category?: string;
  description?: string;
};

const PREDEFINED_CATEGORIES = [
  "Campus",
  "Events",
  "Sports",
  "Facilities",
  "Students",
  "Ceremony",
];

const DOMAIN_PREFIX = "https://yeticollege.edu.np";

/**
 * Standardizes URLs.
 * Adds college prefix to local files and formats Google Drive links.
 */
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return url;

  // 1. If it's a local file, add the college prefix
  if (url.startsWith("/")) {
    return `${DOMAIN_PREFIX}${url}`;
  }

  // 2. If it's not a google drive link, do nothing.
  if (!url.includes("drive.google.com")) return url;

  // 3. Handle Google Drive formats
  if (url.includes("drive.google.com/uc?export=view&id=")) return url;

  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }

  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }

  return url;
};

/**
 * Determines the src attribute for the <img> tag.
 * - Local files (with prefix): Returns as-is.
 * - External files: Wraps in proxy to avoid CORS issues.
 */
const getImageUrl = (url: string): string => {
  if (!url) return "";

  // 1. If it starts with / add prefix and return
  if (url.startsWith("/")) {
    return `${DOMAIN_PREFIX}${url}`;
  }

  // 2. Convert Drive links
  const converted = convertGoogleDriveUrl(url);

  // 3. If it is already a college domain link, don't proxy it
  if (converted.startsWith(DOMAIN_PREFIX)) {
    return converted;
  }

  // 4. If it is an external link (Drive, etc), wrap in proxy
  if (converted.startsWith("http")) {
    return `/api/gallery/image-proxy?url=${encodeURIComponent(converted)}`;
  }

  return converted;
};

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const [categorySelect, setCategorySelect] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    category: "",
    description: "",
  });

  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setEditingItem(null);
    setFormData({ title: "", imageUrl: "", category: "", description: "" });
    setCategorySelect("");
  }, []);

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    if (searchParams.has("create")) {
      setEditingItem(null);
      resetForm();
      setDialogOpen(true);
    }
  }, [searchParams, resetForm]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gallery");
      if (!response.ok) throw new Error("Failed to fetch gallery");
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("[GalleryPage] Error loading gallery:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return images.filter(
      (img) =>
        img.title.toLowerCase().includes(lowerCaseQuery) ||
        img.category?.toLowerCase().includes(lowerCaseQuery),
    );
  }, [images, searchQuery]);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
      if (searchParams.has("create")) {
        router.replace(window.location.pathname, { scroll: false });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const cleanUrl = convertGoogleDriveUrl(formData.imageUrl);

    const processedFormData = {
      ...formData,
      imageUrl: cleanUrl,
    };

    try {
      const url = editingItem
        ? `/api/gallery/${editingItem.id}`
        : "/api/gallery";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to submit gallery item.");
      }

      toast({
        title: "Success",
        description: `Gallery item ${
          editingItem ? "updated" : "added"
        } successfully.`,
      });

      setDialogOpen(false);

      if (searchParams.has("create")) {
        router.replace(window.location.pathname, { scroll: false });
      }

      resetForm();
      fetchGallery();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Submission failed.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    const previousImages = [...images];
    setImages(images.filter((img) => img.id !== id));

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete gallery item.");

      toast({
        title: "Success",
        description: "Gallery item deleted successfully.",
      });
    } catch (error) {
      setImages(previousImages);
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const openEdit = (item: GalleryItem) => {
    setEditingItem(item);

    const currentCategory = item.category || "";
    const isPreset = PREDEFINED_CATEGORIES.includes(currentCategory);
    setCategorySelect(isPreset ? currentCategory : "Custom");

    setFormData({
      title: item.title,
      imageUrl: item.imageUrl,
      category: currentCategory,
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Gallery
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your school photo albums and media library.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Media
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Media" : "Add New Media"}
              </DialogTitle>
              <DialogDescription>
                Add details for your gallery item. All fields are editable
                later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      placeholder="e.g., /images/campus.jpg or a Google Drive link"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  {formData.imageUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={getImageUrl(formData.imageUrl)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-gray-50 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 opacity-50" />
                        <span className="text-sm">
                          Image preview will appear here
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="e.g., Annual Sports Day"
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={categorySelect}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategorySelect(value);
                      setFormData({
                        ...formData,
                        category: value === "Custom" ? "" : value,
                      });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required={categorySelect !== "Custom"}
                  >
                    <option value="">Select a category</option>
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">Custom</option>
                  </select>

                  {categorySelect === "Custom" && (
                    <div className="pt-2">
                      <Input
                        id="customCategory"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        placeholder="Enter custom category"
                        required
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="prose-sm">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(value) =>
                      setFormData({ ...formData, description: value })
                    }
                    placeholder="Describe the media item..."
                    className="bg-background rounded-md"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingItem ? "Update Changes" : "Add to Gallery"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or category..."
          className="pl-9 max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] w-full rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className="overflow-hidden group border-none shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-0 relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={getImageUrl(image.imageUrl) || "/placeholder.svg"}
                  alt={image.title}
                  loading="lazy"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />

                {image.category && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center rounded-md bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                      {image.category}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-full hover:scale-105 transition-transform"
                    onClick={() => openEdit(image)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-10 w-10 rounded-full hover:scale-105 transition-transform"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-card border-t flex flex-col items-start gap-1">
                <h3
                  className="font-semibold truncate w-full"
                  title={image.title}
                >
                  {image.title}
                </h3>
                {image.category && (
                  <p className="text-xs text-muted-foreground">
                    {image.category}
                  </p>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-gray-50">
          <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No media found</h3>
          <p className="text-muted-foreground max-w-sm mt-1">
            {searchQuery
              ? "Try adjusting your search query."
              : "Get started by adding new images to your gallery."}
          </p>
          {!searchQuery && (
            <Button
              variant="link"
              onClick={() => {
                setDialogOpen(true);
                resetForm();
              }}
              className="mt-2"
            >
              Add your first item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
