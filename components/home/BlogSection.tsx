'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'

const blogPosts = [
  {
    id: 1,
    title: 'Comment entretenir vos bijoux',
    excerpt:
      'Conseils essentiels pour garder vos bijoux aussi beaux qu au premier jour.',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '2024-01-15',
  },
  {
    id: 2,
    title: 'Tendances bijoux 2024',
    excerpt:
      'Decouvrez les styles bijoux les plus tendance cette annee.',
    image:
      'https://images.unsplash.com/photo-1603561596112-0a1325a55570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '2024-01-10',
  },
  {
    id: 3,
    title: 'Choisir la bague de fiancailles parfaite',
    excerpt:
      'Un guide complet pour trouver la bague ideale pour votre moment special.',
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: '2024-01-05',
  },
]

export default function BlogSection() {
  return (
    <section className="py-20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Conseils style et entretien
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Decouvrez des conseils experts sur l entretien et le style
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="card overflow-hidden group"
            >
              <Link href={`/blog/${post.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </Link>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-xl font-semibold mb-3 hover:text-primary-600 transition-colors">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 group/link"
                >
                  Lire plus
                  <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/blog" className="btn-primary inline-flex items-center">
            Voir tous les articles
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

