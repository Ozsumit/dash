"use client"

import { ToastProvider } from "@/components/ui/use-toast"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <div className="flex h-screen overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 overflow-y-auto p-8 bg-muted/30">
                    {children}
                </main>
            </div>
        </ToastProvider>
    )
}
