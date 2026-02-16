import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ServicesSection } from './components/ServicesSection'
import { AboutSection } from './components/AboutSection'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <Hero />
      <ServicesSection />
      <AboutSection />
      <Footer />
    </div>
  )
}
