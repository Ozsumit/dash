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

type Notice = {
  id: number
  title: string
  date: string
  displayDate: string
  category: string
  description?: string
  descriptionPreview?: string
  mediaType?: string
  mediaUrl?: string
  accent?: string
  createdAt?: string
  updatedAt?: string
}

const PREDEFINED_CATEGORIES = ["Administrative", "Academic", "Exam", "Holiday"]

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()

  // New state to handle the dropdown UI separately from the data value
  const [categorySelect, setCategorySelect] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    mediaType: "none",
    mediaUrl: "",
    accent: "bg-blue-600",
    imageSource: "url" as "url" | "local",
    localImage: null as File | null,
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const response = await fetch("/api/notices")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to fetch notices")
      }
      const data = await response.json()
      setNotices(
        data.map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          date: new Date(notice.date).toISOString().split("T")[0],
          displayDate: new Date(notice.date).toLocaleDateString(),
          category: notice.category,
          description: notice.description,
          descriptionPreview: notice.description
            ? notice.description.replace(/<[^>]*>/g, "").substring(0, 50) +
              (notice.description.length > 50 ? "..." : "")
            : "",
          mediaType: notice.mediaType
            ? notice.mediaType.charAt(0).toUpperCase() + notice.mediaType.slice(1)
            : "None",
          mediaUrl: notice.mediaUrl,
          accent: notice.accent,
          createdAt: new Date(notice.createdAt).toLocaleDateString(),
          updatedAt: new Date(notice.updatedAt).toLocaleDateString(),
        }))
      )
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load notices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingNotice ? `/api/notices/${editingNotice.id}` : "/api/notices"
      const method = editingNotice ? "PUT" : "POST"

      let body: any
      let headers: any = {}

      if (formData.imageSource === "local" && formData.localImage) {
        body = new FormData()
        body.append("title", formData.title)
        body.append("description", formData.description)
        body.append("date", formData.date)
        body.append("category", formData.category)
        body.append("mediaType", formData.mediaType)
        body.append("accent", formData.accent)
        body.append("file", formData.localImage)
      } else {
        body = JSON.stringify(formData)
        headers["Content-Type"] = "application/json"
      }

      const response = await fetch(url, {
        method,
        body,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Failed to ${editingNotice ? "update" : "create"} notice`)
      }

      setSuccessMessage(`Notice ${editingNotice ? "updated" : "created"} successfully`)
      setSuccessDialogOpen(true)
      setDialogOpen(false)
      setEditingNotice(null)
      resetForm()
      fetchNotices()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit notice",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (item: Notice) => {
    setNoticeToDelete(item)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!noticeToDelete) return
    try {
      const response = await fetch(`/api/notices/${noticeToDelete.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to delete notice")
      }
      setSuccessMessage("Notice deleted successfully")
      setSuccessDialogOpen(true)
      setDeleteDialogOpen(false)
      setNoticeToDelete(null)
      fetchNotices()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete notice",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      mediaType: "none",
      mediaUrl: "",
      accent: "bg-blue-600",
      imageSource: "url",
      localImage: null,
    })
    setCategorySelect("")
  }

  const handleEdit = (item: Notice) => {
    setEditingNotice(item)
    
    // Determine if the category is a preset or custom
    const isPreset = PREDEFINED_CATEGORIES.includes(item.category)
    setCategorySelect(isPreset ? item.category : "Custom")

    setFormData({
      title: item.title,
      description: item.description || "",
      date: item.date,
      category: item.category,
      mediaType: item.mediaType || "none",
      mediaUrl: item.mediaUrl || "",
      accent: item.accent || "bg-blue-600",
      imageSource: item.mediaUrl ? "url" : "local",
      localImage: null,
    })
    setDialogOpen(true)
  }

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Date", accessor: "displayDate" },
    { header: "Category", accessor: "category" },
    { header: "Description", accessor: "descriptionPreview" },
    { header: "Media Type", accessor: "mediaType" },
    { header: "Created", accessor: "createdAt" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading notices...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">Manage school-wide announcements and notices.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNotice(null)
                resetForm()
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Notice
            </Button>
          </DialogTrigger>
          {/* 
            FIX 1: onInteractOutside={(e) => e.preventDefault()} 
            prevents the modal from closing when clicking outside 
          */}
          <DialogContent 
            className="sm:max-w-[525px]"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{editingNotice ? "Edit Notice" : "Add New Notice"}</DialogTitle>
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
                <Label htmlFor="description">Description</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  className="bg-background"
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
              
              {/* FIX 2: Fixed Category Selection Logic */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={categorySelect}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategorySelect(value)
                    // If custom, we clear the actual data so user can type. 
                    // If preset, we update the data immediately.
                    setFormData({ 
                      ...formData, 
                      category: value === "Custom" ? "" : value 
                    })
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required={categorySelect !== "Custom"} // If custom, the Input below handles required
                >
                  <option value="">Select a category</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Academic">Academic</option>
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Custom">Custom</option>
                </select>

                {/* Show input if dropdown is set to Custom */}
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

              {/* Media Type */}
              <div className="space-y-2">
                <Label htmlFor="mediaType">Media Type</Label>
                <select
                  id="mediaType"
                  value={formData.mediaType}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="none">None</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>

              {/* Image Source */}
              <div className="space-y-2">
                <Label>Image Source</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="imageSource"
                      value="url"
                      checked={formData.imageSource === "url"}
                      onChange={() => setFormData({ ...formData, imageSource: "url" })}
                    />
                    Image URL
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="imageSource"
                      value="local"
                      checked={formData.imageSource === "local"}
                      onChange={() => setFormData({ ...formData, imageSource: "local" })}
                    />
                    Upload Local
                  </label>
                </div>
              </div>

              {formData.imageSource === "url" && (
                <div className="space-y-2">
                  <Label htmlFor="mediaUrl">Image URL</Label>
                  <Input
                    id="mediaUrl"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}

              {formData.imageSource === "local" && (
                <div className="space-y-2">
                  <Label htmlFor="localImage">Upload Image</Label>
                  <Input
                    id="localImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({ ...formData, localImage: e.target.files?.[0] || null })
                    }
                  />
                </div>
              )}

              {/* Accent */}
              <div className="space-y-2">
                <Label htmlFor="accent">Accent Color</Label>
                <select
                  id="accent"
                  value={formData.accent}
                  onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="bg-blue-600">Blue</option>
                  <option value="bg-green-600">Green</option>
                  <option value="bg-red-600">Red</option>
                  <option value="bg-yellow-600">Yellow</option>
                  <option value="bg-purple-600">Purple</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingNotice ? "Update" : "Create"} Notice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the notice "{noticeToDelete?.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setSuccessDialogOpen(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DataTable columns={columns} data={notices} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}