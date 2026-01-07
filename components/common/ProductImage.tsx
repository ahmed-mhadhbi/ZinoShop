'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ProductImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
}

// Placeholder SVG for failed image loads
const PlaceholderImage = ({ fill, className }: { fill?: boolean; className?: string }) => (
  <div
    className={`bg-gray-200 flex items-center justify-center ${className}`}
    style={fill ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    } : {}}
  >
    <svg
      className="w-1/2 h-1/2 text-gray-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
        clipRule="evenodd"
      />
    </svg>
  </div>
)

/**
 * Smart image component that handles both base64 data URLs and regular URLs
 * Next.js Image component doesn't support base64 data URLs, so we use regular img for those
 */
export default function ProductImage({
  src,
  alt,
  fill = false,
  className = '',
  sizes,
  priority = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)
  const [imgSrc, setImgSrc] = useState(src)

  // Update imgSrc when src prop changes
  useEffect(() => {
    setImgSrc(src)
    setHasError(false) // Reset error when src changes
  }, [src])

  // Check if it's a base64 data URL
  const isBase64 = imgSrc?.startsWith('data:image/')
  
  // Check if it's an Unsplash URL (which may fail, so we'll use unoptimized)
  const isUnsplash = imgSrc?.includes('unsplash.com')

  // Handle image error for regular img tags
  const handleError = () => {
    if (!hasError) {
      setHasError(true)
    }
  }

  // If no src provided, show placeholder
  if (!imgSrc || imgSrc.trim() === '') {
    return <PlaceholderImage fill={fill} className={className} />
  }

  if (hasError && !isBase64) {
    return <PlaceholderImage fill={fill} className={className} />
  }

  if (isBase64) {
    // Use regular img tag for base64 images
    if (fill) {
      return (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          onError={handleError}
          style={{ 
            objectFit: 'cover', 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )
    }
    return <img src={imgSrc} alt={alt} className={className} onError={handleError} />
  }

  // For Unsplash images or if error occurred, use unoptimized to bypass Next.js image optimization
  // This prevents 404 errors from Next.js image optimization service
  if (isUnsplash || hasError) {
    if (fill) {
      return (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          onError={handleError}
          style={{ 
            objectFit: 'cover', 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )
    }
    return <img src={imgSrc} alt={alt} className={className} onError={handleError} />
  }

  // Use Next.js Image for regular URLs (optimized)
  if (fill) {
    return (
      <Image
        src={imgSrc || '/placeholder-image.jpg'}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onLoadingComplete={(result) => {
          if (result.naturalWidth === 0) {
            setHasError(true)
          }
        }}
      />
    )
  }

  return (
    <Image
      src={imgSrc || '/placeholder-image.jpg'}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
      onLoadingComplete={(result) => {
        if (result.naturalWidth === 0) {
          setHasError(true)
        }
      }}
    />
  )
}

