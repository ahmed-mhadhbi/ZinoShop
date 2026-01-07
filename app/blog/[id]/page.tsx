import { redirect } from 'next/navigation'

export default function BlogPostPage() {
  // Blog pages are removed — redirect to products
  redirect('/products')
}

