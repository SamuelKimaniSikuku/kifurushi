import Link from 'next/link';
import { Package, Shield, Clock, Users, Plane, ArrowRight, Star, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
              Join a community of 250+ Kenyans in Europe, connecting since 2024, who save
              on shipping by sending parcels with community members traveling between
              Europe and Kenya.
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
          <div><strong className="text-2xl text-kenya-green block">250+</strong> Community Members</div>
          <div><strong className="text-2xl text-kenya-green block">2024</strong> Operating Since</div>
          <div><strong className="text-2xl text-kenya-green block">KE ↔ EU</strong> Routes Covered</div>
          <div><strong className="text-2xl text-kenya-green block">100%</strong> Community Run</div>
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
              { icon: Package, title: 'Post Your Parcel', desc: 'Describe what you need sent, the destination, and your budget. No account needed.' },
              { icon: Users, title: 'Match with a Traveler', desc: 'Find community members traveling your route around your dates.' },
              { icon: Shield, title: 'Connect Directly', desc: 'Premium unlocks their WhatsApp & phone. Agree on price and handover.' },
              { icon: Star, title: 'Send & Rate', desc: 'Your parcel travels with a trusted member. Rate the experience after.' },
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
              { icon: CreditCard, title: 'Save Serious Money', desc: 'Courier shipping to Kenya easily costs €50-200. With Kifurushi you agree a fair price per kg directly with the traveler.' },
              { icon: Shield, title: 'A Real Community', desc: 'Not strangers on the internet — a group of Kenyans abroad connecting since 2024, with member profiles and ratings.' },
              { icon: Clock, title: 'Faster Delivery', desc: 'Parcels travel with real people on real flights. Often days, not weeks, door-to-door.' },
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
            Earn money by carrying parcels on your next trip. Post your route and free
            kilos — senders come to you.
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
