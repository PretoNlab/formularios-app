import { Metadata } from "next"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
    title: "Editor | formularios.ia",
    description: "Crie e edite seu formulário.",
}

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Header />
            <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
                {children}
            </div>
        </>
    )
}
