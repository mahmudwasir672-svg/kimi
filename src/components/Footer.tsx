import { Instagram, Linkedin, Twitter, Mail, MapPin, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-foreground text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl">B</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">Burak Ima</span>
            </div>
            <p className="text-white/60 leading-relaxed text-lg">
              Empowering brands through authentic influencer partnerships and data-driven marketing strategies.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition duration-300">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-8">Quick Links</h4>
            <ul className="space-y-4">
              {['Services', 'About Us', 'Campaigns', 'Contact'].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-white/60 hover:text-accent transition text-lg">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-8">Services</h4>
            <ul className="space-y-4">
              {['Influencer Search', 'Strategy Development', 'Content Creation', 'Analytics'].map((service) => (
                <li key={service}>
                  <a href="#services" className="text-white/60 hover:text-accent transition text-lg">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-8">Contact Us</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-white/60">
                <MapPin className="text-accent shrink-0" size={24} />
                <span className="text-lg">123 Marketing Ave, Digital City, 10101</span>
              </li>
              <li className="flex items-center gap-4 text-white/60">
                <Phone className="text-accent shrink-0" size={24} />
                <span className="text-lg">+1 (555) 000-0000</span>
              </li>
              <li className="flex items-center gap-4 text-white/60">
                <Mail className="text-accent shrink-0" size={24} />
                <span className="text-lg">hello@burakima.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-white/40">
          <p className="text-lg">© {new Date().getFullYear()} Burak Ima. All rights reserved.</p>
          <div className="flex gap-8 text-lg">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
