"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
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

type GalleryItem = {
  id: number
  title: string
  imageUrl: string // Updated field name to match schema
  category?: string
  description?: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    category: "",
    description: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    try {
      console.log("[v0] Fetching gallery from /api/gallery")
      const response = await fetch("/api/gallery")
      if (!response.ok) throw new Error("Failed to fetch gallery")
      const data = await response.json()
      setImages(data)
    } catch (error) {
      console.error("[v0] Error loading gallery:", error)
      toast({
        title: "Error",
        description: "Failed to load gallery items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingItem ? `/api/gallery/${editingItem.id}` : "/api/gallery"
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to submit")
      }

      toast({
        title: "Success",
        description: `Item ${editingItem ? "updated" : "added"} successfully`,
      })

      setDialogOpen(false)
      fetchGallery()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Submission failed",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
      fetchGallery()
    } catch (error) {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading gallery...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground">Manage your school photo albums and media.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingItem(null)
                setFormData({ title: "", imageUrl: "", category: "", description: "" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Media
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Media" : "Add New Media"}</DialogTitle>
              <DialogDescription>Provide the image URL and details for the gallery.</DialogDescription>
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
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Campus, Sports"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingItem ? "Update" : "Add"} Media</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden group relative">
            <CardContent className="p-0 relative aspect-video">
              <img
                src={image.imageUrl || "/placeholder.svg"}
                alt={image.title}
                className="object-cover w-full h-full transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-white font-medium px-4 text-center">{image.title}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingItem(image)
                      setFormData({
                        title: image.title,
                        imageUrl: image.imageUrl,
                        category: image.category || "",
                        description: image.description || "",
                      })
                      setDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(image.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
