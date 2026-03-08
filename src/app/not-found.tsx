import Link from "next/link"
import { Sparkles, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
      <div className="space-y-6 max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">formularios.ia</span>
        </Link>

        <div className="flex justify-center">
          <div className="flex bg-muted text-muted-foreground items-center justify-center p-4 rounded-2xl">
            <FileQuestion className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-6xl font-bold text-muted-foreground/30">404</p>
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground text-sm">
            A página que você está procurando não existe ou foi removida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">Ir para o painel</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Página inicial</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
