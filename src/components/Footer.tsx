import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Avatar Atelier</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              The premier marketplace for high-quality Live2D models. empowering VTubers and creators worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/creators" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Top Creators</Link></li>
              <li><Link href="/marketplace" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Browse All</Link></li>
              <li><Link href="/marketplace?price=free" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Free Assets</Link></li>
              <li><Link href="/become-creator" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Become a Seller</Link></li>
              <li><Link href="/buyer-guide" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Buyer Guide</Link></li>
              <li><Link href="/seller-guide" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Seller Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Support & Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Refund Policy</Link></li>
              <li><Link href="/seller-agreement" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Seller Agreement</Link></li>
              <li><Link href="/cookies-policy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Cookies Policy</Link></li>
              <li><Link href="/contact" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} Avatar Atelier. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Twitter</Link>
            <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Discord</Link>
            <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
