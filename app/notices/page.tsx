"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // 1. Import navigation hooks
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // 2. Initialize navigation hooks
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // 3. New Effect: Check for ?create param on mount
  useEffect(() => {
    if (searchParams.has("create")) {
      setEditingNotice(null);
      setFormData({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
      });
      setDialogOpen(true);
    }
  }, [searchParams]);

  // 4. Update Dialog change handler to manage URL
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && searchParams.has("create")) {
      // Remove ?create param when dialog is closed manually
      router.replace(window.location.pathname, { scroll: false });
    }
  };

  const fetchNotices = async () => {
    try {
      const response = await fetch("/api/notices");
      if (!response.ok) throw new Error("Failed to fetch notices");
      const data = await response.json();
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
      console.error(error);
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
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to submit notice");

      toast({
        title: "Success",
        description: `Notice ${
          editingNotice ? "updated" : "created"
        } successfully`,
      });

      setDialogOpen(false);

      // Clear URL param on success
      if (searchParams.has("create")) {
        router.replace(window.location.pathname, { scroll: false });
      }

      setEditingNotice(null);
      setFormData({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
      });
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit notice",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: Notice) => {
    setEditingNotice(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      date: item.date,
      category: item.category,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: Notice) => {
    setNoticeToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!noticeToDelete) return;
    try {
      const response = await fetch(`/api/notices/${noticeToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notice");

      toast({ title: "Success", description: "Notice deleted successfully" });
      setDeleteDialogOpen(false);
      setNoticeToDelete(null);
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete notice",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Date", accessor: "displayDate" },
    { header: "Category", accessor: "category" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading notices...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">
            Manage school-wide announcements and notices.
          </p>
        </div>

        {/* 5. Update Dialog to use handleOpenChange */}
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
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

              {/* Description as Textarea */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                  required
                  className="border p-2 rounded resize-none"
                  placeholder="Type your notice here..."
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  className="border p-2 rounded"
                >
                  <option value="">Select category</option>
                  <option value="Academic">Academic</option>
                  <option value="Event">Event</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
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

      {/* Delete Dialog */}
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
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
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
            <Button onClick={() => setSuccessDialogOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={notices}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
