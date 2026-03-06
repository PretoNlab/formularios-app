import { Header } from "@/components/layout/header"

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
        </div>
    )
}
