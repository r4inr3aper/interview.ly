"use client"

import Link from "next/link"

const Footer = () => {
  return (
    <footer className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Interview.ly. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


