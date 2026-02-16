import { Award, Lightbulb, Target } from 'lucide-react'

const stats = [
  { number: '500+', label: 'Influencers in Network' },
  { number: '150+', label: 'Successful Campaigns' },
  { number: '$50M+', label: 'Total Campaign Value' },
]

const values = [
  {
    icon: Target,
    title: 'Authentic Connections',
    description: 'We believe in genuine relationships between brands and influencers that create real impact.',
  },
  {
    icon: Lightbulb,
    title: 'Strategic Thinking',
    description: 'Every campaign is thoughtfully planned and executed with measurable goals and clear KPIs.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We maintain the highest standards in everything we do, from partnerships to results.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="space-y-4 mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
          About Burak Ima
        </h2>
        <p className="text-lg text-secondary max-w-2xl">
          Leading the future of influencer marketing through authentic partnerships and data-driven strategies.
        </p>
      </div>

      {/* Story */}
      <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-foreground">Our Story</h3>
          <p className="text-secondary leading-relaxed">
            Founded with a vision to revolutionize how brands connect with audiences, Burak Ima has become a trusted partner for industry-leading companies seeking authentic influencer marketing solutions.
          </p>
          <p className="text-secondary leading-relaxed">
            Our team brings together years of experience in digital marketing, content creation, and brand strategy. We've built a network of talented influencers across multiple niches and demographics.
          </p>
          <p className="text-secondary leading-relaxed">
            What sets us apart is our commitment to transparency, authenticity, and results. We don't just connect brands with influencers—we create meaningful partnerships that deliver measurable impact.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="p-6 rounded-xl bg-accent/5 border border-accent/20 text-center">
              <div className="text-3xl font-bold text-accent mb-2">{stat.number}</div>
              <div className="text-sm text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="space-y-8">
        <h3 className="text-3xl font-bold text-foreground">Our Values</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent" size={24} />
                </div>
                <h4 className="text-xl font-semibold text-foreground">{value.title}</h4>
                <p className="text-secondary leading-relaxed">{value.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Team Preview */}
      <div className="mt-20 p-12 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
        <h3 className="text-2xl font-bold text-foreground mb-4">Meet Our Team</h3>
        <p className="text-secondary mb-8">
          Our team consists of seasoned marketing professionals, creative strategists, and influencer relations experts dedicated to your success.
        </p>
        <button className="px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 transition">
          View Our Team
        </button>
      </div>
    </section>
  )
}
