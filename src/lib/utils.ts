import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl() {
  let url =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? // Vercel Production URL
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel for all deployments
    process.env.NEXT_PUBLIC_APP_URL ?? // Our defined env var (usually localhost)
    "http://localhost:3000"

  // Make sure to include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`

  // Make sure to remove trailing slash.
  url = url.endsWith("/") ? url.slice(0, -1) : url

  return url
}
