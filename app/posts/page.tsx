"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Wand2 } from "lucide-react"; // Added Wand2 icon
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import dynamic from "next/dynamic";

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type Post = {
  id: number;
  title: string;
  author: string;
  date: string;
  excerpt?: string;
  category?: string;
  featured?: boolean;
  trending?: boolean;
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [formData, setFormData] = useState({
    // Content Fields
    title: "",
    excerpt: "",
    author: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    content: "",
    image: "",
    // Boolean Fields
    isFeatured: false,
    isTrending: false,
    // SEO Fields
    seoTitle: "",
    seoDescription: "",
    noIndex: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();

      setPosts(
        data.map((post: any) => ({
          id: post.id,
          title: post.title,
          author: post.author,
          date: new Date(post.date).toLocaleDateString(),
          excerpt: post.excerpt,
          category: post.category,
          featured: post.featured,
          trending: post.trending,
        })),
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to strip HTML tags from Quill content for SEO Description
  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return html;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // <CHANGE> New handler to populate SEO fields
  const handlePopulateSeo = () => {
    const plainExcerpt = stripHtml(formData.excerpt);

    setFormData((prev) => ({
      ...prev,
      seoTitle: prev.title,
      // Truncate description slightly if it's massive, or keep it full for user to edit
      seoDescription: plainExcerpt.substring(0, 300),
    }));

    toast({
      title: "SEO Data Populated",
      description: "Meta tags updated from title and excerpt.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts";
      const method = editingPost ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingPost ? "update" : "create"} post`);
      }

      toast({
        title: "Success",
        description: `Post ${editingPost ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: Post) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/posts/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete post");

      toast({ title: "Success", description: "Post deleted successfully" });
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (item: Post) => {
    try {
      const response = await fetch(`/api/posts/${item.id}`);
      if (!response.ok) throw new Error("Failed to fetch post details");

      const post = await response.json();
      setEditingPost(item);

      setFormData({
        title: post.title,
        excerpt: post.excerpt || "",
        author: post.author,
        date: new Date(post.date).toISOString().split("T")[0],
        category: post.category || "",
        content: post.content || "",
        image: post.image || "",
        isFeatured: post.featured || false,
        isTrending: post.trending || false,
        seoTitle: post.seo?.metaTitle || "",
        seoDescription: post.seo?.metaDescription || "",
        noIndex: post.seo?.noIndex || false,
      });
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      excerpt: "",
      author: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      content: "",
      image: "",
      isFeatured: false,
      isTrending: false,
      seoTitle: "",
      seoDescription: "",
      noIndex: false,
    });
  };

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Author", accessor: "author" },
    { header: "Published Date", accessor: "date" },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage your articles and blog content.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? "Edit Post" : "Create New Post"}
              </DialogTitle>
              <DialogDescription>
                Manage post content and SEO settings.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Social</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: MAIN CONTENT --- */}
                <TabsContent value="content" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) =>
                          setFormData({ ...formData, author: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Featured & Trending Options */}
                  <div className="flex space-x-6 border p-3 rounded-md bg-muted/20">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isFeatured: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="isFeatured" className="cursor-pointer">
                        Featured Post
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isTrending"
                        checked={formData.isTrending}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isTrending: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="isTrending" className="cursor-pointer">
                        Trending Now
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      type="url"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <ReactQuill
                      theme="snow"
                      value={formData.excerpt}
                      onChange={(value) =>
                        setFormData({ ...formData, excerpt: value })
                      }
                      className="bg-white h-24 mb-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Full Content</Label>
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={(value) =>
                        setFormData({ ...formData, content: value })
                      }
                      className="bg-white h-48 mb-12"
                    />
                  </div>
                </TabsContent>

                {/* --- TAB 2: SEO CONFIGURATION --- */}
                <TabsContent value="seo" className="space-y-4 pt-4">
                  <div className="bg-muted/50 p-4 rounded-md space-y-4">
                    {/* <CHANGE> Auto-fetch button */}
                    <div className="flex justify-between items-center pb-2 border-b border-muted-foreground/20">
                      <h3 className="text-sm font-semibold">
                        Metadata Settings
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePopulateSeo}
                        className="text-xs h-8"
                        disabled={!formData.title && !formData.excerpt}
                      >
                        <Wand2 className="w-3 h-3 mr-2" />
                        Populate from Content
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seoTitle">Meta Title</Label>
                      <Input
                        id="seoTitle"
                        placeholder="Custom title for Google"
                        value={formData.seoTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, seoTitle: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.seoTitle.length} chars (Rec: 60)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seoDescription">Meta Description</Label>
                      <Input
                        id="seoDescription"
                        placeholder="Summary for search results"
                        value={formData.seoDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            seoDescription: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.seoDescription.length} chars (Rec: 160)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox
                        id="noIndex"
                        checked={formData.noIndex}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            noIndex: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="noIndex">
                        No Index (Hide from Google)
                      </Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPost ? "Update" : "Create"} Post
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        columns={columns}
        data={posts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
