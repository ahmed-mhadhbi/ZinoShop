'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'
import api from '@/lib/api'

import { redirect } from 'next/navigation'

export default function BlogPage() {
  redirect('/products')
} 

