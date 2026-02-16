import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-accent/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Burak Ima</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-sm text-secondary hover:text-foreground transition">
            Services
          </a>
          <a href="#about" className="text-sm text-secondary hover:text-foreground transition">
            About
          </a>
          <a href="#contact" className="text-sm text-secondary hover:text-foreground transition">
            Contact
          </a>
          <button className="px-6 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-foreground"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-accent/20 px-4 py-4 flex flex-col gap-4">
          <a href="#services" className="text-sm text-secondary hover:text-foreground transition">
            Services
          </a>
          <a href="#about" className="text-sm text-secondary hover:text-foreground transition">
            About
          </a>
          <a href="#contact" className="text-sm text-secondary hover:text-foreground transition">
            Contact
          </a>
          <button className="px-6 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition w-full">
            Get Started
          </button>
        </div>
      )}
    </header>
  )
}
