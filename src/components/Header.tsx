import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-md border-b border-accent/10 py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <span className="text-white font-black text-xl">B</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Burak Ima</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8">
            <a href="#services" className="text-sm font-semibold text-secondary hover:text-accent transition">
              Services
            </a>
            <a href="#about" className="text-sm font-semibold text-secondary hover:text-accent transition">
              About
            </a>
            <a href="#contact" className="text-sm font-semibold text-secondary hover:text-accent transition">
              Contact
            </a>
          </div>
          <button className="px-7 py-3 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent/90 transition shadow-lg shadow-accent/20">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-foreground hover:bg-accent/5 rounded-lg transition"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden absolute top-full left-0 right-0 bg-background border-b border-accent/10 overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          <a 
            href="#services" 
            onClick={() => setIsOpen(false)}
            className="text-lg font-bold text-secondary hover:text-accent transition"
          >
            Services
          </a>
          <a 
            href="#about" 
            onClick={() => setIsOpen(false)}
            className="text-lg font-bold text-secondary hover:text-accent transition"
          >
            About
          </a>
          <a 
            href="#contact" 
            onClick={() => setIsOpen(false)}
            className="text-lg font-bold text-secondary hover:text-accent transition"
          >
            Contact
          </a>
          <button className="px-6 py-4 bg-accent text-white rounded-full text-lg font-bold hover:bg-accent/90 transition w-full shadow-lg shadow-accent/20">
            Get Started
          </button>
        </div>
      </div>
    </header>
  )
}
