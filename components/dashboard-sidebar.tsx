import Link from "next/link";
import {
  LayoutDashboard,
  Bell,
  FileText,
  Volleyball,
  BellRing,
  Calendar,
  ImageIcon,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Notices", href: "/notices", icon: Bell },
  { name: "Blog Posts", href: "/posts", icon: FileText },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Gallery", href: "/gallery", icon: ImageIcon },
  { name: "Sports ", href: "/sports-registrations", icon: Volleyball },
  { name: "Popups", href: "/popup", icon: BellRing },
];

export function DashboardSidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center px-6 border-b">
        <span className="text-lg font-bold tracking-tight">
          Yeti College Dashboard
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        {/* <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link> */}
      </div>
    </div>
  );
}
