"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Menu, X, User, LogOut, Settings } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/firebase/client"
import type { User as FirebaseUser } from "firebase/auth"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleSignOut = async () => {
    console.log('handleSignOut called, isSigningOut:', isSigningOut)
    if (isSigningOut) {
      console.log('Already signing out, returning early')
      return // Prevent multiple sign-out attempts
    }
    
    try {
      console.log('Starting sign out process...')
      setIsSigningOut(true)
      setIsUserMenuOpen(false)
      
      // Sign out from Firebase client first
      await signOut(auth)
      
      // Clear server-side session cookie via fetch
      try {
        await fetch('/api/auth/signout', { 
          method: 'POST',
          credentials: 'include' // Ensure cookies are included
        })
      } catch (fetchError) {
        console.error('Failed to clear server session:', fetchError)
        // Continue anyway - client sign out succeeded
      }
      
      // Force a complete page reload to clear all state
      window.location.href = '/sign-in'
      
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if sign-out fails, redirect to clear state
      window.location.href = '/sign-in'
    } finally {
      setIsSigningOut(false)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Interview.ly
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link 
                  href="/interview" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Interviews
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </>
            )}
            <Link 
              href="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:bg-muted"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-muted-foreground border-b">
                        {user.email}
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={(e) => {
                          console.log('Desktop sign-out button clicked')
                          e.preventDefault()
                          e.stopPropagation()
                          handleSignOut()
                        }}
                        disabled={isSigningOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" 
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="md:hidden relative z-50">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {user && (
                  <>
                    <Link
                      href="/interview"
                      className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Interviews
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </>
                )}
                <Link
                  href="/about"
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                
                {user ? (
                  <div className="pt-4 pb-2 space-y-2">
                    <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                      {user.email}
                    </div>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      disabled={isSigningOut}
                      className="w-full justify-start text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      onClick={(e) => {
                        console.log('Mobile sign-out button clicked')
                        e.preventDefault()
                        e.stopPropagation()
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 pb-2 space-y-2">
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
