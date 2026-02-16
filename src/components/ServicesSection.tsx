import { CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react'

const services = [
  {
    icon: Users,
    title: 'Influencer Partnerships',
    description: 'Connect with the right influencers who align with your brand values and reach your target audience authentically.',
  },
  {
    icon: TrendingUp,
    title: 'Campaign Strategy',
    description: 'Develop comprehensive influencer marketing strategies that drive engagement, awareness, and conversions.',
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Track, analyze, and optimize campaigns in real-time to maximize ROI and audience engagement.',
  },
  {
    icon: CheckCircle2,
    title: 'Content Creation',
    description: 'Access high-quality content from influencers that resonates with audiences and builds brand credibility.',
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="space-y-4 mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
          Our Services
        </h2>
        <p className="text-lg text-secondary max-w-2xl">
          Comprehensive solutions for influencer-driven marketing success
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {services.map((service, index) => {
          const Icon = service.icon
          return (
            <div key={index} className="group p-8 rounded-2xl border border-accent/20 hover:border-accent/50 hover:bg-accent/5 transition duration-300">
              <div className="mb-6 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition duration-300">
                <Icon className="w-6 h-6 text-accent group-hover:text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {service.title}
              </h3>
              <p className="text-secondary leading-relaxed">
                {service.description}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-16 p-12 rounded-2xl bg-accent/5 border border-accent/20">
        <h3 className="text-2xl font-semibold text-foreground mb-4">
          Ready to grow your brand?
        </h3>
        <p className="text-secondary mb-8 max-w-2xl">
          Let's discuss how our influencer marketing expertise can help you achieve your business goals.
        </p>
        <button className="px-8 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 transition">
          Schedule a Consultation
        </button>
      </div>
    </section>
  )
}
