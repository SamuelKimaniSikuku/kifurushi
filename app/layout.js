import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Kifurushi - Peer-to-Peer Parcel Delivery for the Kenyan Diaspora',
  description: 'Send and receive parcels between Europe and Kenya through trusted community travelers. Save up to 70% on shipping costs.',
  keywords: 'Kenya, diaspora, parcel delivery, peer to peer, shipping, Europe, Africa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-3">Kifurushi</h3>
                <p className="text-sm">Connecting the Kenyan diaspora through trusted peer-to-peer parcel delivery.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/trips" className="hover:text-white">Browse Trips</a></li>
                  <li><a href="/parcels" className="hover:text-white">Send a Parcel</a></li>
                  <li><a href="/premium" className="hover:text-white">Premium Plans</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Trust & Safety</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">How It Works</a></li>
                  <li><a href="#" className="hover:text-white">ID Verification</a></li>
                  <li><a href="#" className="hover:text-white">Escrow Protection</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Contact</h4>
                <ul className="space-y-2 text-sm">
                  <li>hello@kifurushi.co</li>
                  <li><a href="#" className="hover:text-white">WhatsApp Community</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
              &copy; {new Date().getFullYear()} Kifurushi. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
