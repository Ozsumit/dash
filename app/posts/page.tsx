"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

type Post = {
  id: number
  title: string
  author: string
  date: string
  excerpt?: string
  category?: string
}

const PREDEFINED_CATEGORIES = ["News", "Events", "Academic", "Student Life", "Sports"]

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  
  // New state to handle the dropdown UI separately from the data value
  const [categorySelect, setCategorySelect] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    author: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    content: "",
    image: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      console.log("[v0] Fetching posts from /api/posts")
      const response = await fetch("/api/posts")
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to fetch posts")
      }

      const data = await response.json()
      setPosts(
        data.map((post: any) => ({
          id: post.id,
          title: post.title,
          author: post.author,
          date: new Date(post.date).toLocaleDateString(),
          excerpt: post.excerpt,
          category: post.category,
        })),
      )
    } catch (error) {
      console.error("[v0] Failed to fetch posts:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      author: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      content: "",
      image: "",
    })
    setCategorySelect("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts"
      const method = editingPost ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Failed to ${editingPost ? "update" : "create"} post`)
      }

      toast({
        title: "Success",
        description: `Post ${editingPost ? "updated" : "created"} successfully`,
      })

      setDialogOpen(false)
      setEditingPost(null)
      resetForm()
      fetchPosts()
    } catch (error) {
      console.error("[v0] Failed to submit post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit post",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (item: Post) => {
    try {
      const response = await fetch(`/api/posts/${item.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to delete post")
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      fetchPosts()
    } catch (error) {
      console.error("[v0] Failed to delete post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (item: Post) => {
    try {
      const response = await fetch(`/api/posts/${item.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch post details")
      }
      const post = await response.json()
      setEditingPost(item)
      
      // Determine if category is preset or custom
      const currentCategory = post.category || ""
      const isPreset = PREDEFINED_CATEGORIES.includes(currentCategory)
      setCategorySelect(isPreset ? currentCategory : "Custom")

      setFormData({
        title: post.title,
        excerpt: post.excerpt || "",
        author: post.author,
        date: new Date(post.date).toISOString().split("T")[0],
        category: currentCategory,
        content: post.content || "",
        image: post.image || "",
      })
      setDialogOpen(true)
    } catch (error) {
      console.error("[v0] Failed to fetch post for editing:", error)
      toast({
        title: "Error",
        description: "Failed to load post details for editing",
        variant: "destructive",
      })
    }
  }

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Author", accessor: "author" },
    { header: "Category", accessor: "category" },
    { header: "Published Date", accessor: "date" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your articles and blog content.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPost(null)
              resetForm()
            }}>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          {/* FIX 1: Prevent closing on outside click */}
          <DialogContent 
            className="sm:max-w-[625px]"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
              <DialogDescription>
                {editingPost ? "Update the blog post details below." : "Fill in the details to create a new blog post."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.excerpt}
                  onChange={(value) => setFormData({ ...formData, excerpt: value })}
                  placeholder="Brief summary of the post"
                  className="bg-white"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* FIX 2: Fixed Category Selection Logic */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={categorySelect}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategorySelect(value)
                    setFormData({ 
                      ...formData, 
                      category: value === "Custom" ? "" : value 
                    })
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required={categorySelect !== "Custom"}
                >
                  <option value="">Select a category</option>
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>

                {categorySelect === "Custom" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="customCategory">Custom Category Name</Label>
                    <Input
                      id="customCategory"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter custom category"
                      required
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Write your post content here..."
                  className="bg-white"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote", "code-block"],
                      ["link", "image"],
                      [{ color: [] }, { background: [] }],
                      ["clean"],
                    ],
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
  )
}