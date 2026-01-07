import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import Promotions from '@/components/home/Promotions'
import Testimonials from '@/components/home/Testimonials'

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <FeaturedProducts />
      <Promotions />
      <Testimonials />
    </div>
  )
}

