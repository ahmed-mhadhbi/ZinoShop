import Link from 'next/link'
import { Instagram, Mail, Phone, MapPin } from 'lucide-react'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.12V2h-3.2v13.34a2.9 2.9 0 1 1-2-2.77V9.29a6.11 6.11 0 1 0 5.2 6.05V8.51a8 8 0 0 0 4.77 1.59V6.91c-.34 0-.67-.08-1-.22z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-serif font-bold text-white mb-4">
              ZinoShop
            </h3>
            <p className="text-gray-400 mb-4">
              Votre destination bijoux. Concu avec precision,
              pense avec elegance.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:zino.shop.contact@gmail.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Gmail"
                title="Gmail"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/zino.shop.online/"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@zino.shop.online?_r=1&_t=ZS-94LzjZeh95c"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="TikTok"
                title="TikTok"
                target="_blank"
                rel="noreferrer"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  Produits
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  A propos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
                <span className="text-gray-400">bouficha,sousse</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-500" />
                <span className="text-gray-400">+216 23638945</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-500" />
                <span className="text-gray-400">zino.shop.contact@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            � {new Date().getFullYear()} ZinoShop. Tous droits reserves.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Politique de confidentialite
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
