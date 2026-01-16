"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// <CHANGE> Added dialog components for Add/Edit functionality
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
import { Textarea } from "@/components/ui/textarea";
// /c/
type Notice = {
  id: number;
  title: string;
  date: string;
  category: string;
  description?: string;
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      console.log("[v0] Fetching notices from /api/notices");
      const response = await fetch("/api/notices");
      console.log("[v0] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[v0] Error response:", errorData);
        throw new Error(errorData.details || "Failed to fetch notices");
      }

      const data = await response.json();
      console.log("[v0] Fetched notices:", data);

      setNotices(
        data.map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          date: new Date(notice.date).toISOString().split("T")[0],
          displayDate: new Date(notice.date).toLocaleDateString(),
          category: notice.category,
          description: notice.description,
        }))
      );
    } catch (error) {
      console.error("[v0] Failed to fetch notices:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load notices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingNotice
        ? `/api/notices/${editingNotice.id}`
        : "/api/notices";
      const method = editingNotice ? "PUT" : "POST";

      console.log(`[v0] ${method} ${url}`, formData);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details ||
            `Failed to ${editingNotice ? "update" : "create"} notice`
        );
      }

      toast({
        title: "Success",
        description: `Notice ${
          editingNotice ? "updated" : "created"
        } successfully`,
      });

      setDialogOpen(false);
      setEditingNotice(null);
      setFormData({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
      });
      fetchNotices();
    } catch (error) {
      console.error("[v0] Failed to submit notice:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit notice",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: Notice) => {
    try {
      console.log("[v0] Deleting notice:", item.id);
      const response = await fetch(`/api/notices/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to delete notice");
      }

      toast({
        title: "Success",
        description: "Notice deleted successfully",
      });
      fetchNotices();
    } catch (error) {
      console.error("[v0] Failed to delete notice:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete notice",
        variant: "destructive",
      });
    }
  };

  // <CHANGE> Implemented handleEdit to populate form with existing data
  const handleEdit = (item: Notice) => {
    console.log("[v0] Editing notice:", item);
    setEditingNotice(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      date: item.date,
      category: item.category,
    });
    setDialogOpen(true);
  };

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Date", accessor: "displayDate" },
    { header: "Category", accessor: "category" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading notices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">
            Manage school-wide announcements and notices.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNotice(null);
                setFormData({
                  title: "",
                  description: "",
                  date: new Date().toISOString().split("T")[0],
                  category: "",
                });
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
              <DialogTitle>
                {editingNotice ? "Edit Notice" : "Add New Notice"}
              </DialogTitle>
              <DialogDescription>
                {editingNotice
                  ? "Update the notice details below."
                  : "Fill in the details to create a new notice."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={4}
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

              {/* FIX 2: Fixed Category Selection Logic */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Academic, Event, General"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNotice ? "Update" : "Create"} Notice
                </Button>
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
              Are you sure you want to delete the notice "
              {noticeToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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

      <DataTable
        columns={columns}
        data={notices}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
