import Link from 'next/link';
import { Package, Shield, Clock, Users, Plane, ArrowRight, Star, CreditCard } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-kenya-green to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Send Parcels Between Europe & Kenya Through Trusted Travelers
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Join 2,000+ Kenyans in Europe who save up to 70% on shipping by connecting
              with community members traveling between Europe and Kenya.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/parcels" className="bg-accent hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                Send a Parcel
              </Link>
              <Link href="/trips" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border border-white/30">
                Browse Trips
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center text-sm text-gray-600">
          <div><strong className="text-2xl text-kenya-green block">2,000+</strong> Community Members</div>
          <div><strong className="text-2xl text-kenya-green block">5,000+</strong> Parcels Delivered</div>
          <div><strong className="text-2xl text-kenya-green block">15+</strong> European Countries</div>
          <div><strong className="text-2xl text-kenya-green block">4.8/5</strong> Trust Rating</div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How Kifurushi Works</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            A simple, secure way to send parcels with people you trust
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Package, title: 'Post Your Parcel', desc: 'Describe what you need sent, the destination, and your budget.' },
              { icon: Users, title: 'Match with a Traveler', desc: 'Connect with verified community members traveling your route.' },
              { icon: Shield, title: 'Secure Payment', desc: 'Pay through our escrow system. Funds released on delivery.' },
              { icon: Star, title: 'Confirm & Rate', desc: 'Confirm delivery with a photo. Rate your experience.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-kenya-green" />
                </div>
                <div className="bg-kenya-green text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Kifurushi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: CreditCard, title: 'Save Up to 70%', desc: 'Typical DHL/FedEx costs $50-200. Kifurushi averages $15-40 per parcel.' },
              { icon: Shield, title: 'Trust & Safety', desc: 'ID verification, community vouching, ratings, and escrow protection on every delivery.' },
              { icon: Clock, title: 'Faster Delivery', desc: 'Parcels travel with real people on real flights. Often 2-5 days door-to-door.' },
            ].map((f, i) => (
              <div key={i} className="card p-8 text-center hover:shadow-lg transition-shadow">
                <f.icon className="h-10 w-10 text-accent mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <Plane className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Traveling Soon?</h2>
          <p className="text-xl mb-8 text-orange-100">
            Earn money by carrying parcels on your next trip. Premium members earn 3x more with priority listings.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/trips/new" className="bg-white text-accent px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
              Post Your Trip
            </Link>
            <Link href="/premium" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors flex items-center gap-2">
              Go Premium <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
