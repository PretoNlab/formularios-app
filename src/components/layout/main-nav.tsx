"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Templates", href: "/templates" },
  { name: "Analytics", href: "/analytics" },
  { name: "Configurações", href: "/settings" },
  { name: "Ajuda", href: "/help" },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/50 shadow-sm">
      {navItems.map((item) => {
        // Special logic to not highlight /settings if we're just matching the prefix, but since our settings routes are /settings/* it's fine.
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
