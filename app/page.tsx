"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  FileText,
  Calendar,
  ImageIcon,
  Trophy,
  ArrowRight,
  Activity,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Define interfaces for your data types
interface Event {
  id: number;
  title: string;
  date: string;
  location?: string;
}

interface Notice {
  id: number;
  title: string;
  createdAt: string;
}

interface DashboardData {
  counts: {
    events: number;
    gallery: number;
    notices: number;
    posts: number;
    registrations: number;
  };
  recentActivity: {
    events: Event[];
    notices: Notice[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    counts: {
      events: 0,
      gallery: 0,
      notices: 0,
      posts: 0,
      registrations: 0,
    },
    recentActivity: {
      events: [],
      notices: [],
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all data in parallel to be efficient
        const [noticesRes, postsRes, eventsRes, regsRes, galleryRes] =
          await Promise.allSettled([
            fetch("/api/notices"),
            fetch("/api/posts"),
            fetch("/api/events"),
            fetch("/api/registrations"), // Verify if this endpoint is 'registrations' or 'sports-registrations'
            fetch("/api/gallery"),
          ]);

        // Helper function to extract data safely
        const getData = async (result: PromiseSettledResult<Response>) => {
          if (result.status === "fulfilled" && result.value.ok) {
            const json = await result.value.json();
            // Check if api returns { data: [...] } or just [...]
            return Array.isArray(json) ? json : json.data || [];
          }
          return [];
        };

        const notices = await getData(noticesRes);
        const posts = await getData(postsRes);
        const events = await getData(eventsRes);
        const registrations = await getData(regsRes);
        const gallery = await getData(galleryRes);

        // Sort events by date (nearest first) and notices by creation (newest first)
        // This assumes your API returns standard date strings
        const sortedEvents = [...events].sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const sortedNotices = [...notices].sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setData({
          counts: {
            notices: notices.length,
            posts: posts.length,
            events: events.length,
            registrations: registrations.length,
            gallery: gallery.length,
          },
          recentActivity: {
            // Take top 5 for display
            events: sortedEvents
              .filter((e: any) => new Date(e.date) >= new Date())
              .slice(0, 5),
            notices: sortedNotices.slice(0, 5),
          },
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { counts, recentActivity } = data;

  const statsCards = [
    {
      name: "Total Notices",
      value: counts.notices,
      icon: Bell,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/notices",
    },
    {
      name: "Blog Posts",
      value: counts.posts,
      icon: FileText,
      color: "text-green-500",
      bg: "bg-green-500/10",
      href: "/posts",
    },
    {
      name: "Events Scheduled",
      value: counts.events,
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      href: "/events",
    },
    {
      name: "Sports Regs",
      value: counts.registrations,
      icon: Trophy,
      color: "text-red-500",
      bg: "bg-red-500/10",
      href: "/sports-registrations",
    },
    {
      name: "Gallery Albums",
      value: counts.gallery,
      icon: ImageIcon,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/gallery",
    },
  ];

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsCards.map((stat) => (
          <Link
            href={stat.href}
            key={stat.name}
            className="block transition-opacity hover:opacity-80"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active records
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Notices Column */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>
              The latest announcements published to the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivity.notices.length > 0 ? (
                recentActivity.notices.map((notice) => (
                  <div className="flex items-center" key={notice.id}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notice.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notice.createdAt).toLocaleDateString(
                          undefined,
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="ml-auto font-medium"></div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notices found.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/notices">
                  View All Notices <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Column */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Events scheduled for the near future.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivity.events.length > 0 ? (
                recentActivity.events.map((event) => (
                  <div className="flex items-start gap-4" key={event.id}>
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-muted p-2 w-14 text-center">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        {new Date(event.date).toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-xl font-bold">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.location || "TBD"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming events.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/events">
                  Manage Events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Create Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/events?create">
                <Calendar className="mr-2 h-4 w-4" /> Add Event
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Create Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/notices?create">
                <Bell className="mr-2 h-4 w-4" /> Post Notice
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Create Blog</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/posts?create">
                <FileText className="mr-2 h-4 w-4" /> Write Blog
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Create Popup</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/popup?create">
                <FileText className="mr-2 h-4 w-4" /> Create Popup
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Create Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/gallery?create">
                <FileText className="mr-2 h-4 w-4" /> Create Gallery
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <Activity className="h-4 w-4" />
            <span>All Systems Operational</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
