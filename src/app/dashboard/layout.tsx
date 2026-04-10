import { Header } from "@/components/layout/header"
import { SupportWidget } from "@/components/dashboard/support-widget"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
                {children}
            </div>
            <SupportWidget />
        </div>
    )
}
