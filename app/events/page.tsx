"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // 1. Import navigation hooks
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import dynamic from "next/dynamic";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type Event = {
  id: number;
  title: string;
  date: string; // Display string
  rawDate: string; // ISO string for the form
  location: string;
  description?: string;
  category?: string;
  image?: string;
};

const PREDEFINED_CATEGORIES = [
  "Academic",
  "Sports",
  "Cultural",
  "Meeting",
  "Holiday",
  "Workshop",
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // 2. Initialize navigation hooks
  const searchParams = useSearchParams();
  const router = useRouter();

  // State for the category dropdown selection
  const [categorySelect, setCategorySelect] = useState("");

  // Helper to format Date objects to "YYYY-MM-DDTHH:mm" for datetime-local input
  const formatDateForInput = (dateInput: string | Date = new Date()) => {
    const d = new Date(dateInput);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(d.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: formatDateForInput(),
    location: "",
    category: "",
    image: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  // 3. New Effect: Check for ?create param on mount
  useEffect(() => {
    if (searchParams.has("create")) {
      setEditingEvent(null);
      resetForm();
      setDialogOpen(true);

      // Optional: Clean up URL after opening so refresh doesn't reopen it
      // router.replace("/admin/events", { scroll: false });
    }
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to fetch events");
      }
      const data = await response.json();

      // Sort events by latest date first
      const sortedData = data.sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(
        sortedData.map((event: any) => ({
          id: event.id,
          title: event.title,
          // Formatted string for the table display
          date: new Date(event.date).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          // Raw ISO string to be used when editing
          rawDate: event.date,
          location: event.location,
          description: event.description,
          category: event.category,
          image: event.image,
        }))
      );
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: formatDateForInput(),
      location: "",
      category: "",
      image: "",
    });
    setCategorySelect("");
  };

  // 4. Update Dialog change handler to manage URL if needed
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && searchParams.has("create")) {
      // Remove ?create param when dialog is closed manually
      router.replace(window.location.pathname, { scroll: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent
        ? `/api/events/${editingEvent.id}`
        : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details ||
            `Failed to ${editingEvent ? "update" : "create"} event`
        );
      }

      toast({
        title: "Success",
        description: `Event ${
          editingEvent ? "updated" : "created"
        } successfully`,
      });

      setDialogOpen(false);

      // Clear URL param on success
      if (searchParams.has("create")) {
        router.replace(window.location.pathname, { scroll: false });
      }

      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit event",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: Event) => {
    setEditingEvent(item);

    // Check if current category is in predefined list
    const currentCategory = item.category || "";
    const isPreset = PREDEFINED_CATEGORIES.includes(currentCategory);
    setCategorySelect(
      isPreset ? currentCategory : currentCategory ? "Custom" : ""
    );

    setFormData({
      title: item.title,
      description: item.description || "",
      date: formatDateForInput(item.rawDate),
      location: item.location,
      category: currentCategory,
      image: item.image || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (item: Event) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to delete event");
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { header: "Event Name", accessor: "title" },
    { header: "Date & Time", accessor: "date" },
    { header: "Location", accessor: "location" },
    { header: "Category", accessor: "category" },
  ];

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Schedule and manage upcoming school events and meetings.
          </p>
        </div>

        {/* 5. Update Dialog to use handleOpenChange */}
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEvent(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Add New Event"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details below. Time is automatically adjusted to
                your local zone.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Event Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                  placeholder="Describe the event details..."
                  className="bg-white"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "clean"],
                    ],
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={categorySelect}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategorySelect(value);
                      // If picking a preset, update formData.category immediately
                      // If picking "Custom", clear formData.category so user can type
                      setFormData({
                        ...formData,
                        category: value === "Custom" ? "" : value,
                      });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select a category</option>
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">Other (Custom)</option>
                  </select>
                </div>
              </div>

              {categorySelect === "Custom" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="customCategory">Custom Category Name</Label>
                  <Input
                    id="customCategory"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g. Graduation"
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. School Auditorium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL (Optional)</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <DataTable
          columns={columns}
          data={events}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
