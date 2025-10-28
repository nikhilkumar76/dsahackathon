import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Amdraipt - AI-Driven Timetable Generation System",
  description: "Adaptive Multi-Dimensional Resource Allocation and Intelligent Planning Tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
