'use client'

import { useState } from 'react'
import { Plane, Menu, X, Search, BarChart3, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Flight Search</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
          <a 
            href="#search" 
            onClick={(e) => handleNavClick(e, 'search')}
            className="text-sm font-medium hover:text-primary transition-all duration-300 hover:translate-y-0.5 active:translate-y-1"
          >
            {'ค้นหา'}
          </a>
          <a 
            href="#analysis" 
            onClick={(e) => handleNavClick(e, 'analysis')}
            className="text-sm font-medium hover:text-primary transition-all duration-300 hover:translate-y-0.5 active:translate-y-1"
          >
            {'วิเคราะห์ราคา'}
          </a>
          <a 
            href="#destinations" 
            onClick={(e) => handleNavClick(e, 'destinations')}
            className="text-sm font-medium hover:text-primary transition-all duration-300 hover:translate-y-0.5 active:translate-y-1"
          >
            {'ปลายทางยอดนิยม'}
          </a>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {/* <Button variant="ghost" size="sm">
            {'เข้าสู่ระบบ'}
          </Button>
          <Button size="sm">
            {'สมัครสมาชิก'}
          </Button> */}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-[320px] sm:w-[380px] p-0 flex flex-col bg-gradient-to-b from-background to-secondary/20"
          >
            {/* Header Section with Gradient Background */}
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 pb-8">
              <SheetHeader className="space-y-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                      <Plane className="w-7 h-7 text-white" />
                    </div>
                    <SheetTitle className="text-white text-xl font-bold">
                      Flight Search
                    </SheetTitle>
                  </div>
                </div>
                <p className="text-white/90 text-sm font-normal">
                  ค้นหาตั๋วเครื่องบินราคาถูกที่สุด
                </p>
              </SheetHeader>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
              <a 
                href="#search" 
                onClick={(e) => handleNavClick(e, 'search')}
                className="flex items-center gap-4 px-4 py-4 rounded-xl bg-background/80 hover:bg-primary/10 hover:shadow-md transition-all duration-200 group border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Search className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors flex-1">
                  {'ค้นหา'}
                </span>
              </a>

              <a 
                href="#analysis" 
                onClick={(e) => handleNavClick(e, 'analysis')}
                className="flex items-center gap-4 px-4 py-4 rounded-xl bg-background/80 hover:bg-primary/10 hover:shadow-md transition-all duration-200 group border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <BarChart3 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors flex-1">
                  {'วิเคราะห์ราคา'}
                </span>
              </a>

              <a 
                href="#destinations" 
                onClick={(e) => handleNavClick(e, 'destinations')}
                className="flex items-center gap-4 px-4 py-4 rounded-xl bg-background/80 hover:bg-primary/10 hover:shadow-md transition-all duration-200 group border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <MapPin className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors flex-1">
                  {'ปลายทางยอดนิยม'}
                </span>
              </a>
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 bg-background/50">
              <p className="text-xs text-muted-foreground text-center">
                © {new Date().getFullYear()} Flight Search
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
