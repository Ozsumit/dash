"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

// Types
interface Popup {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    buttonText: "Learn More",
    buttonLink: "/",
    isActive: false,
  });

  // Fetch Data
  const fetchPopups = async () => {
    try {
      const res = await fetch("/api/popup");
      const data = await res.json();

      // Check if the data is an array before setting state
      if (Array.isArray(data)) {
        setPopups(data);
      } else {
        console.error("Received non-array data:", data);
        setPopups([]); // Set to empty array to avoid .map() crash
      }
    } catch (error) {
      console.error("Failed to fetch popups", error);
      setPopups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  // Handlers
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      buttonText: "Learn More",
      buttonLink: "/",
      isActive: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (popup: Popup) => {
    setEditingId(popup.id);
    setFormData({
      title: popup.title,
      description: popup.description,
      imageUrl: popup.imageUrl || "",
      buttonText: popup.buttonText,
      buttonLink: popup.buttonLink,
      isActive: popup.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this popup?")) return;

    try {
      const res = await fetch(`/api/popup/${id}`, { method: "DELETE" });
      if (res.ok) fetchPopups();
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId ? `/api/popup/${editingId}` : "/api/popup";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPopups();
      } else {
        alert("Something went wrong");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (popup: Popup) => {
    // Optimistic update
    setPopups((prev) =>
      prev.map(
        (p) =>
          p.id === popup.id
            ? { ...p, isActive: !p.isActive }
            : { ...p, isActive: false } // Deactivate others if activating this one
      )
    );

    try {
      await fetch(`/api/popup/${popup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...popup, isActive: !popup.isActive }),
      });
      fetchPopups(); // Sync with server to be sure
    } catch (error) {
      fetchPopups(); // Revert on error
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans text-zinc-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Popup Manager</h1>
            <p className="text-zinc-500">Manage site-wide announcements.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-zinc-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
          >
            <Plus className="w-5 h-5" />
            Create New Popup
          </button>
        </div>

        {/* Content List */}
        {loading && popups.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popups.map((popup) => (
              <div
                key={popup.id}
                className={`group bg-white rounded-3xl p-6 shadow-sm border-2 transition-all duration-300 relative overflow-hidden ${
                  popup.isActive
                    ? "border-green-500 shadow-green-100"
                    : "border-transparent hover:border-zinc-200"
                }`}
              >
                {/* Active Badge */}
                <div className="flex justify-between items-start mb-4">
                  <button
                    onClick={() => toggleActive(popup)}
                    className={`text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-colors ${
                      popup.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
                    }`}
                  >
                    {popup.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                        Inactive
                      </>
                    )}
                  </button>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(popup)}
                      className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-900 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(popup.id)}
                      className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                {popup.imageUrl && (
                  <div className="h-32 mb-4 rounded-xl bg-zinc-100 overflow-hidden relative">
                    <img
                      src={popup.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h3 className="font-bold text-lg leading-tight mb-2 truncate">
                  {popup.title}
                </h3>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                  {popup.description}
                </p>

                {/* Button Preview */}
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 bg-zinc-50 p-3 rounded-xl">
                  <ExternalLink className="w-4 h-4" />
                  Button:{" "}
                  <span className="text-zinc-900">{popup.buttonText}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Popup" : "Create Popup"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-4 bg-zinc-50 rounded-xl font-medium focus:ring-2 focus:ring-zinc-900 outline-none"
                    placeholder="e.g. Registration Open"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Image URL (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      className="w-full p-4 pl-12 bg-zinc-50 rounded-xl font-medium focus:ring-2 focus:ring-zinc-900 outline-none"
                      placeholder="https://..."
                    />
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-4 bg-zinc-50 rounded-xl font-medium focus:ring-2 focus:ring-zinc-900 outline-none resize-none"
                  placeholder="What is this announcement about?"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Button Text
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                    className="w-full p-4 bg-zinc-50 rounded-xl font-medium focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Button Link
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buttonLink}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonLink: e.target.value })
                    }
                    className="w-full p-4 bg-zinc-50 rounded-xl font-medium focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div
                className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl cursor-pointer"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    formData.isActive
                      ? "bg-zinc-900 border-zinc-900"
                      : "border-zinc-300 bg-white"
                  }`}
                >
                  {formData.isActive && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="select-none">
                  <p className="font-bold text-sm">Set as Active Popup</p>
                  <p className="text-xs text-zinc-500">
                    This will deactivate other popups.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-4 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update Popup" : "Create Popup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
