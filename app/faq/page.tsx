import { redirect } from 'next/navigation'

export default function FAQPage() {
  // FAQ/Customer Service has been removed — redirect to products
  redirect('/products')
}

