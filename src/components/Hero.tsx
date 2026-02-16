export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
      <div className="space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground text-balance leading-tight">
          Connect Brands with Influential Voices
        </h1>
        <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto">
          We create authentic partnerships between brands and influencers that drive real engagement and measurable results.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button className="px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 transition text-lg">
            Start a Campaign
          </button>
          <button className="px-8 py-4 border-2 border-accent text-accent rounded-full font-semibold hover:bg-accent hover:text-white transition text-lg">
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}
