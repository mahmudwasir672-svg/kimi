import { CheckCircle2, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react'

const services = [
  {
    icon: Users,
    title: 'Influencer Partnerships',
    description: 'Connect with the right influencers who align with your brand values and reach your target audience authentically.',
    color: 'bg-blue-500'
  },
  {
    icon: TrendingUp,
    title: 'Campaign Strategy',
    description: 'Develop comprehensive influencer marketing strategies that drive engagement, awareness, and conversions.',
    color: 'bg-purple-500'
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Track, analyze, and optimize campaigns in real-time to maximize ROI and audience engagement.',
    color: 'bg-orange-500'
  },
  {
    icon: CheckCircle2,
    title: 'Content Creation',
    description: 'Access high-quality content from influencers that resonates with audiences and builds brand credibility.',
    color: 'bg-green-500'
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
        <div className="space-y-4 max-w-2xl">
          <div className="text-accent font-bold tracking-widest uppercase text-sm">Our Expertise</div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            Comprehensive solutions for <span className="text-accent">growth</span>
          </h2>
        </div>
        <p className="text-lg text-secondary max-w-md leading-relaxed">
          We provide end-to-end influencer marketing services designed to scale your brand's presence in the digital landscape.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {services.map((service, index) => {
          const Icon = service.icon
          return (
            <div key={index} className="group relative p-10 rounded-[2rem] border border-accent/10 bg-white hover:border-accent/30 transition-all duration-500 hover:-translate-y-2">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-16 h-16 rounded-2xl ${service.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className={`w-8 h-8 text-accent`} />
                </div>
                <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <ArrowRight size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {service.title}
              </h3>
              <p className="text-secondary text-lg leading-relaxed mb-6">
                {service.description}
              </p>
              <div className="h-1 w-0 bg-accent group-hover:w-full transition-all duration-500 rounded-full" />
            </div>
          )
        })}
      </div>

      <div className="mt-24 p-12 md:p-16 rounded-[3rem] bg-accent/5 border border-accent/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to grow your brand?
            </h3>
            <p className="text-secondary text-lg max-w-xl">
              Let's discuss how our influencer marketing expertise can help you achieve your business goals.
            </p>
          </div>
          <button className="whitespace-nowrap px-10 py-5 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition shadow-xl shadow-accent/20 text-lg">
            Schedule a Consultation
          </button>
        </div>
      </div>
    </section>
  )
}
