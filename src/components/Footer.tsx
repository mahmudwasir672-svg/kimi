import { Mail, Linkedin, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-secondary/5 border-t border-accent/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Burak Ima</span>
            </div>
            <p className="text-secondary text-sm">
              Leading the future of influencer marketing through authentic partnerships.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><a href="#services" className="hover:text-foreground transition">Influencer Partnerships</a></li>
              <li><a href="#services" className="hover:text-foreground transition">Campaign Strategy</a></li>
              <li><a href="#services" className="hover:text-foreground transition">Performance Optimization</a></li>
              <li><a href="#services" className="hover:text-foreground transition">Content Creation</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><a href="#about" className="hover:text-foreground transition">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition">Press</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <div className="space-y-4">
              <a href="mailto:hello@burakima.com" className="flex items-center gap-2 text-sm text-secondary hover:text-foreground transition">
                <Mail size={16} />
                hello@burakima.com
              </a>
              <div className="flex gap-4">
                <a href="#" className="text-secondary hover:text-accent transition">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-secondary hover:text-accent transition">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-secondary hover:text-accent transition">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-accent/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary">
          <p>&copy; 2024 Burak Ima. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
