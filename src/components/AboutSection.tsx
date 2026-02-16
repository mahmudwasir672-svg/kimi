import { Award, Lightbulb, Target, Users, BarChart3, Globe } from 'lucide-react'

const stats = [
  { number: '500+', label: 'Influencers in Network', icon: Users },
  { number: '150+', label: 'Successful Campaigns', icon: BarChart3 },
  { number: '$50M+', label: 'Total Campaign Value', icon: Globe },
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
    <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
        <div className="space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
            About Burak Ima
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
            Leading the future of <span className="text-accent">influencer marketing</span>
          </h2>
          <p className="text-xl text-secondary leading-relaxed">
            Founded with a vision to revolutionize how brands connect with audiences, Burak Ima has become a trusted partner for industry-leading companies seeking authentic influencer marketing solutions.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-8 pt-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2 text-accent">
                    <Icon size={20} />
                    <span className="text-3xl font-bold">{stat.number}</span>
                  </div>
                  <p className="text-sm text-secondary font-medium">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden bg-accent/5 border border-accent/10 shadow-2xl">
            <img 
              src="/images/collaboration.jpg" 
              alt="Professional Collaboration" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 w-2/3 aspect-video rounded-2xl overflow-hidden border-4 border-background shadow-2xl hidden md:block">
            <img 
              src="/images/dashboard.jpg" 
              alt="Marketing Analytics" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h3 className="text-3xl font-bold text-foreground">Our Core Values</h3>
          <p className="text-secondary">What sets us apart is our commitment to transparency, authenticity, and results.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="group p-8 rounded-3xl bg-white border border-accent/10 hover:border-accent/30 hover:shadow-xl transition duration-300">
                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition duration-300">
                  <Icon className="w-7 h-7 text-accent group-hover:text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">{value.title}</h4>
                <p className="text-secondary leading-relaxed">{value.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-24 relative rounded-[2.5rem] overflow-hidden bg-foreground p-12 md:p-20 text-center">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="/images/office.jpg" 
            alt="Office Environment" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h3 className="text-3xl md:text-5xl font-bold text-white">Meet Our Team</h3>
          <p className="text-white/70 text-lg">
            Our team consists of seasoned marketing professionals, creative strategists, and influencer relations experts dedicated to your success.
          </p>
          <button className="px-10 py-4 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition shadow-lg shadow-accent/20">
            View Our Team
          </button>
        </div>
      </div>
    </section>
  )
}
