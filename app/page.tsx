"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, FileText, Calendar, ImageIcon, TrendingUp } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useState, useEffect } from "react"

const data = [
  { name: "Jan", total: 12 },
  { name: "Feb", total: 18 },
  { name: "Mar", total: 25 },
  { name: "Apr", total: 32 },
  { name: "May", total: 45 },
  { name: "Jun", total: 60 },
]

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({
    notices: 0,
    posts: 0,
    events: 0,
    gallery: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats")
        if (res.ok) {
          const data = await res.json()
          setStatsData(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats = [
    {
      name: "Active Notices",
      value: statsData.notices.toString(),
      icon: Bell,
      color: "text-blue-500",
      change: "+2 this week",
    },
    {
      name: "Blog Posts",
      value: statsData.posts.toString(),
      icon: FileText,
      color: "text-green-500",
      change: "+5 this month",
    },
    {
      name: "Upcoming Events",
      value: statsData.events.toString(),
      icon: Calendar,
      color: "text-orange-500",
      change: "2 tomorrow",
    },
    {
      name: "Gallery Photos",
      value: statsData.gallery.toString(),
      icon: ImageIcon,
      color: "text-purple-500",
      change: "+12 new",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Comprehensive overview of your school's digital presence.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Content Growth</CardTitle>
            <CardDescription>Visualizing post and notice volume over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--primary))" }}
                  />
                  <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>Key trends detected in your recent activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">User Engagement Up</p>
                <p className="text-xs text-muted-foreground">Post views increased by 15% this week.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Drafts Pending</p>
                <p className="text-xs text-muted-foreground">You have 3 blog posts awaiting review.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Major Event Approaching</p>
                <p className="text-xs text-muted-foreground">"Annual Sports Day" is in 10 days.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
