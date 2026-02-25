'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  sku: z.string().optional(),
  category: z.enum(['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Pendants', 'Other']),
  material: z.enum(['Gold', 'Silver', 'Platinum', 'Pearl', 'Diamond', 'Other']),
  stock: z.number().min(0, 'Stock must be positive'),
})

type ProductFormData = z.infer<typeof productSchema>

const MAX_IMAGE_SIDE_PX = 1200
const TARGET_IMAGE_BYTES = 220 * 1024
const MAX_IMAGES_PAYLOAD_BYTES = 850 * 1024
const MIN_QUALITY = 0.4
const QUALITY_STEP = 0.1

const estimateDataUrlSize = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.ceil((base64.length * 3) / 4)
}

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to decode image'))
    }
    img.src = objectUrl
  })

const compressImageToDataUrl = async (file: File, maxBytes: number): Promise<string> => {
  const img = await loadImageFromFile(file)
  const scale = Math.min(1, MAX_IMAGE_SIDE_PX / Math.max(img.width, img.height))
  let width = Math.max(1, Math.round(img.width * scale))
  let height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not initialize canvas')

  let bestDataUrl = ''
  let bestSize = Number.POSITIVE_INFINITY
  let pass = 0

  while (pass < 5) {
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.9
    while (quality >= MIN_QUALITY) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      const size = estimateDataUrlSize(dataUrl)
      if (size < bestSize) {
        bestDataUrl = dataUrl
        bestSize = size
      }
      if (size <= maxBytes) {
        return dataUrl
      }
      quality -= QUALITY_STEP
    }

    width = Math.max(1, Math.round(width * 0.85))
    height = Math.max(1, Math.round(height * 0.85))
    pass += 1
  }

  return bestDataUrl
}

export default function NewProductPage() {
  const router = useRouter()
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    let currentPayloadBytes = images.reduce((sum, image) => sum + estimateDataUrlSize(image), 0)
    
    for (const file of Array.from(files)) {
      try {
        const remainingBudget = Math.max(80 * 1024, MAX_IMAGES_PAYLOAD_BYTES - currentPayloadBytes)
        const maxBytesForImage = Math.min(TARGET_IMAGE_BYTES, remainingBudget)
        const dataUrl = await compressImageToDataUrl(file, maxBytesForImage)
        const imageBytes = estimateDataUrlSize(dataUrl)

        if (currentPayloadBytes + imageBytes > MAX_IMAGES_PAYLOAD_BYTES) {
          toast.error(`Processed ${file.name}, but total image payload is still too large. Remove another image and retry.`)
          continue
        }

        newImages.push(dataUrl)
        currentPayloadBytes += imageBytes
      } catch (error) {
        console.error('Error converting image:', error)
        toast.error(`Failed to process ${file.name}`)
      }
    }
    
    setImages([...images, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      await api.post('/products', {
        ...data,
        images,
        isActive: true,
      })
      toast.success('Product created successfully!')
      // Dispatch event to refresh products on client side
      window.dispatchEvent(new Event('productsUpdated'))
      router.push('/admin/products')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <h1 className="text-4xl font-serif font-bold mb-8">Add New Product</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Product Name *</label>
              <input
                type="text"
                {...register('name')}
                className="input-field"
                placeholder="Diamond Solitaire Ring"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                SKU <span className="text-gray-500 text-xs">(optional - auto-generated if empty)</span>
              </label>
              <input
                type="text"
                {...register('sku')}
                className="input-field"
                placeholder="Leave empty to auto-generate"
              />
              {errors.sku && (
                <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description *</label>
            <textarea
              {...register('description')}
              className="input-field min-h-[150px]"
              placeholder="Product description..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Price *</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="input-field"
                placeholder="2999.00"
              />
              {errors.price && (
                <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Category *</label>
              <select {...register('category')} className="input-field">
                <option value="">Select category</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Earrings">Earrings</option>
                <option value="Pendants">Pendants</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Material *</label>
              <select {...register('material')} className="input-field">
                <option value="">Select material</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Platinum">Platinum</option>
                <option value="Pearl">Pearl</option>
                <option value="Diamond">Diamond</option>
                <option value="Other">Other</option>
              </select>
              {errors.material && (
                <p className="text-red-600 text-sm mt-1">{errors.material.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Stock Quantity *</label>
            <input
              type="number"
              {...register('stock', { valueAsNumber: true })}
              className="input-field"
              placeholder="10"
            />
            {errors.stock && (
              <p className="text-red-600 text-sm mt-1">{errors.stock.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Product Images</label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

