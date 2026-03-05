'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type PromoKey = 'new' | 'special'

const PROMOTIONS: Array<{
  key: PromoKey
  title: string
  subtitle: string
  image: string
  badge: string
  href?: string
  cta: string
}> = [
  {
    key: 'new',
    title: 'Nouvelle collection',
    subtitle: 'Decouvrez nos dernieres creations',
    image:
      "url('https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
    badge: 'Nouveau',
    href: '/products',
    cta: 'Acheter maintenant',
  },
  {
    key: 'special',
    title: 'Offre speciale',
    subtitle: 'Jusqu a 30% de reduction sur une selection',
    image: "url('/promotion.webp')",
    badge: 'Jusqu a -30%',
    cta: 'Bientot',
  },
]

export default function Promotions() {
  const [activePromo, setActivePromo] = useState<PromoKey | null>(null)
  const [shakePromo, setShakePromo] = useState<PromoKey | null>(null)
  const [didScrollShake, setDidScrollShake] = useState(false)
  const [activatedOnce, setActivatedOnce] = useState<Record<PromoKey, boolean>>({
    new: false,
    special: false,
  })
  const timeoutRefs = useRef<Array<ReturnType<typeof setTimeout>>>([])

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutRefs.current = []
    }
  }, [])

  const queueTimeout = (fn: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      fn()
      timeoutRefs.current = timeoutRefs.current.filter((storedId) => storedId !== timeoutId)
    }, delay)
    timeoutRefs.current.push(timeoutId)
  }

  const triggerShake = (key: PromoKey) => {
    setShakePromo(key)
    queueTimeout(() => {
      setShakePromo((current) => (current === key ? null : current))
    }, 460)
  }

  const triggerFirstInteraction = (key: PromoKey) => {
    if (activatedOnce[key]) return

    setActivatedOnce((previous) => ({
      ...previous,
      [key]: true,
    }))
    triggerShake(key)
  }

  const handleActivate = (key: PromoKey) => {
    setActivePromo(key)
    triggerFirstInteraction(key)
  }

  const handleTap = (key: PromoKey) => {
    if (activePromo === key) {
      setActivePromo(null)
      return
    }
    handleActivate(key)
  }

  const handleScrollShake = () => {
    if (didScrollShake) return

    setDidScrollShake(true)
    triggerShake('new')
    queueTimeout(() => triggerShake('special'), 190)
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          onViewportEnter={handleScrollShake}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-md text-xs font-semibold text-primary-700">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Explorez nos offres
          </div>

          <div
            className="flex gap-3 sm:gap-5 h-[17.5rem] sm:h-[25rem]"
            onMouseLeave={() => setActivePromo(null)}
          >
            {PROMOTIONS.map((promotion, index) => {
              const isActive = activePromo === promotion.key
              const hasActiveSibling = activePromo !== null
              const isCollapsed = hasActiveSibling && !isActive

              return (
                <motion.div
                  key={promotion.key}
                  animate={{
                    flex: isActive ? 1.6 : isCollapsed ? 0.4 : 1,
                    rotate: shakePromo === promotion.key ? [0, -0.9, 0.9, -0.6, 0.5, 0] : 0,
                  }}
                  transition={{
                    flex: { type: 'spring', stiffness: 210, damping: 25 },
                    rotate: { duration: 0.45, ease: 'easeOut' },
                  }}
                  className="min-w-0 relative overflow-hidden rounded-[1.75rem] shadow-lg cursor-pointer"
                  onMouseEnter={() => handleActivate(promotion.key)}
                  onClick={() => handleTap(promotion.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleTap(promotion.key)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                    className="relative h-full"
                  >
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: promotion.image }}
                      animate={{
                        scale: isActive ? 1.1 : isCollapsed ? 1.02 : 1.05,
                      }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

                    <div
                      className={`absolute top-4 left-4 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-semibold bg-white/90 text-gray-900 shadow-sm transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
                    >
                      {promotion.badge}
                    </div>

                    <div
                      className={`relative z-10 h-full flex flex-col justify-end p-4 sm:p-8 text-white transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'}`}
                    >
                      <h3 className="text-xl sm:text-3xl font-serif font-bold mb-1 sm:mb-2">
                        {promotion.title}
                      </h3>
                      <p className="text-sm sm:text-lg mb-3 sm:mb-4 text-gray-100 max-w-sm">
                        {promotion.subtitle}
                      </p>

                      {promotion.href ? (
                        <Link
                          href={promotion.href}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex w-fit items-center text-sm sm:text-base text-white font-semibold hover:text-gold-300 transition-colors group/link"
                        >
                          {promotion.cta}
                          <ArrowRight className="ml-2 w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center text-sm sm:text-base text-white font-semibold opacity-90">
                          {promotion.cta}
                        </span>
                      )}
                    </div>

                    <div
                      className={`absolute z-10 bottom-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-semibold text-white bg-black/35 backdrop-blur-sm rounded-full px-2.5 py-1 transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {promotion.badge}
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

