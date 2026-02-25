'use client'

import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <FileText className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Conditions d'utilisation</h1>
          <p className="text-gray-600">Derniere mise a jour: decembre 2024</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Acceptation</h2>
            <p>En utilisant ZinoShop, vous acceptez ces conditions. Si vous n etes pas d accord, merci de ne pas utiliser le service.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Utilisation</h2>
            <p>Le contenu est fourni pour un usage personnel et non commercial.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Informations produits</h2>
            <p>Nous faisons le maximum pour fournir des informations exactes, sans garantie d absence totale d erreur.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Prix</h2>
            <p>Tous les prix sont en TND et peuvent changer sans preavis.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Paiement</h2>
            <p>Paiement a la livraison uniquement.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Responsabilite</h2>
            <p>ZinoShop ne pourra pas etre tenu responsable des dommages indirects lies a l utilisation du service.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Contact</h2>
            <p>Pour toute question: legal@zinoshop.com.</p>
          </section>
        </motion.div>
      </div>
    </div>
  )
}
