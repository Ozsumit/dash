"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
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

type SportsRegistration = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  participationType: string;
  sport: string;
  teamName?: string;
  message?: string;
  createdAt: string;
};

export default function SportsRegistrationsPage() {
  const [registrations, setRegistrations] = useState<SportsRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    participationType: "Solo",
    sport: "",
    teamName: "",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/sports-registrations");

      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }

      const data = await response.json();
      setRegistrations(
        data.map((reg: any) => ({
          id: reg.id,
          firstName: reg.firstName,
          lastName: reg.lastName,
          email: reg.email,
          phone: reg.phone,
          participationType: reg.participationType,
          sport: reg.sport,
          teamName: reg.teamName || "-",
          message: reg.message || "-",
          createdAt: new Date(reg.createdAt).toLocaleDateString(),
        }))
      );
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
      toast({
        title: "Error",
        description: "Failed to load sports registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phone ||
        !formData.sport
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (formData.participationType === "Team" && !formData.teamName) {
        toast({
          title: "Validation Error",
          description: "Team name is required for team participation",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/sports-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create registration");
      }

      toast({
        title: "Success",
        description: "Registration created successfully",
      });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        participationType: "Solo",
        sport: "",
        teamName: "",
        message: "",
      });
      setDialogOpen(false);
      fetchRegistrations();
    } catch (error) {
      console.error("Failed to create registration:", error);
      toast({
        title: "Error",
        description: "Failed to create registration",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: SportsRegistration) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const response = await fetch(`/api/sports-registrations/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete registration");
      }

      toast({
        title: "Success",
        description: "Registration deleted successfully",
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Failed to delete registration:", error);
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { header: "First Name", accessor: "firstName" },
    { header: "Last Name", accessor: "lastName" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    { header: "Sport", accessor: "sport" },
    { header: "Type", accessor: "participationType" },
    { header: "Team Name", accessor: "teamName" },
    { header: "Date", accessor: "createdAt" },
  ];

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sports Registrations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage sports event registrations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Sports Registration</DialogTitle>
              <DialogDescription>
                Create a new sports registration entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport *</Label>
                  <Input
                    id="sport"
                    value={formData.sport}
                    onChange={(e) =>
                      setFormData({ ...formData, sport: e.target.value })
                    }
                    placeholder="e.g., Football, Cricket, Basketball"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participationType">
                    Participation Type *
                  </Label>
                  <select
                    id="participationType"
                    value={formData.participationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        participationType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Solo">Solo</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
              </div>

              {formData.participationType === "Team" && (
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                    placeholder="Enter team name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Additional message or notes"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Registration</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={registrations}
        onDelete={handleDelete}
      />
    </div>
  );
}
