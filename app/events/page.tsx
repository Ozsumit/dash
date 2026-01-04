"use client"

import type React from "react"
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

type Event = {
  id: number
  title: string
  date: string
  location: string
  description?: string
  category?: string
}

const PREDEFINED_CATEGORIES = ["Academic", "Sports", "Cultural", "Meeting", "Holiday", "Workshop"]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  
  // New state to handle the dropdown UI separately from the data value
  const [categorySelect, setCategorySelect] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    category: "",
    image: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      console.log("[v0] Fetching events from /api/events")
      const response = await fetch("/api/events")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to fetch events")
      }
      const data = await response.json()
      setEvents(
        data.map((event: any) => ({
          id: event.id,
          title: event.title,
          date: new Date(event.date).toLocaleDateString(),
          location: event.location,
          description: event.description,
          category: event.category,
        })),
      )
    } catch (error) {
      console.error("[v0] Error loading events:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      category: "",
      image: "",
    })
    setCategorySelect("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events"
      const method = editingEvent ? "PUT" : "POST"

      console.log(`[v0] ${method} ${url}`, formData)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Failed to ${editingEvent ? "update" : "create"} event`)
      }

      toast({
        title: "Success",
        description: `Event ${editingEvent ? "updated" : "created"} successfully`,
      })

      setDialogOpen(false)
      setEditingEvent(null)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error("[v0] Submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit event",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: Event) => {
    setEditingEvent(item)
    
    // Determine if category is preset or custom
    const currentCategory = item.category || ""
    const isPreset = PREDEFINED_CATEGORIES.includes(currentCategory)
    setCategorySelect(isPreset ? currentCategory : "Custom")

    setFormData({
      title: item.title,
      description: item.description || "",
      date: new Date(item.date).toISOString().split("T")[0],
      location: item.location,
      category: currentCategory,
      image: (item as any).image || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (item: Event) => {
    try {
      console.log("[v0] Deleting event:", item.id)
      const response = await fetch(`/api/events/${item.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to delete event")
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
      fetchEvents()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  const columns = [
    { header: "Event Name", accessor: "title" },
    { header: "Date", accessor: "date" },
    { header: "Location", accessor: "location" },
    { header: "Category", accessor: "category" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Schedule and manage upcoming school events.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEvent(null)
                resetForm()
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          {/* FIX 1: Prevent closing on outside click */}
          <DialogContent 
            className="sm:max-w-[525px]"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
              <DialogDescription>Enter the event details below. All fields are required.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Name</Label>
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
                  placeholder="Describe the event details..."
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingEvent ? "Update" : "Create"} Event</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={events} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}