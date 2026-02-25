'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Politique de confidentialite</h1>
          <p className="text-gray-600">Derniere mise a jour: decembre 2024</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Informations collectees</h2>
            <p>Nous collectons les informations que vous fournissez lors de la creation de compte, de la commande ou du contact.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Utilisation des donnees</h2>
            <p>Ces donnees servent a traiter vos commandes, repondre a vos demandes et ameliorer nos services.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Partage des donnees</h2>
            <p>Nous ne vendons pas vos donnees personnelles. Elles peuvent etre partagees avec des prestataires necessaires au service.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Securite</h2>
            <p>Nous mettons en place des mesures de securite appropriees, sans pouvoir garantir un risque nul.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Vos droits</h2>
            <p>Vous pouvez demander l acces, la mise a jour ou la suppression de vos donnees personnelles.</p>
          </section>
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Contact</h2>
            <p>Pour toute question: privacy@zinoshop.com.</p>
          </section>
        </motion.div>
      </div>
    </div>
  )
}
