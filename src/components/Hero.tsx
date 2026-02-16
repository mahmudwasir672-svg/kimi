export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-accent text-sm font-semibold tracking-wide uppercase animate-fade-in">
            The Next Generation of Marketing
          </div>
          
          <h1 className="text-5xl md:text-8xl font-extrabold text-foreground tracking-tight leading-[1.05] text-balance">
            Connect Brands with <span className="text-accent">Influential</span> Voices
          </h1>
          
          <p className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto leading-relaxed">
            We create authentic partnerships between brands and influencers that drive real engagement and measurable results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
            <button className="px-10 py-5 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition-all hover:scale-105 shadow-xl shadow-accent/25 text-lg">
              Start a Campaign
            </button>
            <button className="px-10 py-5 border-2 border-accent/20 text-foreground rounded-full font-bold hover:bg-accent/5 transition-all text-lg">
              Learn More
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="pt-20 border-t border-accent/10 mt-20">
            <p className="text-sm font-bold text-secondary/60 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
              <div className="text-2xl font-black italic">BRAND ONE</div>
              <div className="text-2xl font-black italic">TECH FLOW</div>
              <div className="text-2xl font-black italic">GLOBAL MEDIA</div>
              <div className="text-2xl font-black italic">VIBE AGENCY</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
