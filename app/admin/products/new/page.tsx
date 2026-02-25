'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const productSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caracteres'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caracteres'),
  price: z.number().min(0, 'Le prix doit etre positif'),
  sku: z.string().optional(),
  category: z.enum(['Bracelets', 'colliers', 'bague', 'series', 'manchettes', 'rangements', 'montres']),
  material: z.enum(['Gold', 'Silver', 'Platinum', 'Pearl', 'Diamond', 'Other']),
  stock: z.number().min(0, 'Le stock doit etre positif'),
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
  const [variants, setVariants] = useState<string[]>([])
  const [variantInput, setVariantInput] = useState('')
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
          toast.error(`Image ${file.name} traitee, mais la taille totale reste trop grande. Supprimez une autre image et reessayez.`)
          continue
        }

        newImages.push(dataUrl)
        currentPayloadBytes += imageBytes
      } catch (error) {
        console.error('Erreur de conversion image:', error)
        toast.error(`Echec du traitement de ${file.name}`)
      }
    }
    
    setImages([...images, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const addVariant = () => {
    const cleaned = variantInput.trim()
    if (!cleaned) return
    if (variants.some((variant) => variant.toLowerCase() === cleaned.toLowerCase())) {
      toast.error('Cette variante existe deja')
      return
    }
    setVariants([...variants, cleaned])
    setVariantInput('')
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      await api.post('/products', {
        ...data,
        images,
        variants,
        isActive: true,
      })
      toast.success('Produit cree avec succes !')
      // Dispatch event to refresh products on client side
      window.dispatchEvent(new Event('productsUpdated'))
      router.push('/admin/products')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Echec de creation du produit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <h1 className="text-4xl font-serif font-bold mb-8">Ajouter un produit</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Nom du produit *</label>
              <input
                type="text"
                {...register('name')}
                className="input-field"
                placeholder="Bague diamant solitaire"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                SKU <span className="text-gray-500 text-xs">(optionnel - genere automatiquement si vide)</span>
              </label>
              <input
                type="text"
                {...register('sku')}
                className="input-field"
                placeholder="Laisser vide pour generation automatique"
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
              placeholder="Description du produit..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Prix *</label>
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
              <label className="block text-sm font-semibold mb-2">Categorie *</label>
              <select {...register('category')} className="input-field">
                <option value="">Selectionner une categorie</option>
                <option value="Bracelets">Bracelets</option>
                <option value="colliers">colliers</option>
                <option value="bague">bague</option>
                <option value="series">series</option>
                <option value="manchettes">manchettes</option>
                <option value="rangements">rangements</option>
                <option value="montres">montres</option>
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Matiere *</label>
              <select {...register('material')} className="input-field">
                <option value="">Selectionner une matiere</option>
                <option value="Gold">Or</option>
                <option value="Silver">Argent</option>
                <option value="Platinum">Platine</option>
                <option value="Pearl">Perle</option>
                <option value="Diamond">Diamant</option>
                <option value="Other">Autre</option>
              </select>
              {errors.material && (
                <p className="text-red-600 text-sm mt-1">{errors.material.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Quantite en stock *</label>
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
            <label className="block text-sm font-semibold mb-2">Variantes (optionnel)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={variantInput}
                onChange={(e) => setVariantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addVariant()
                  }
                }}
                className="input-field flex-1"
                placeholder="Ex: noir, jaune, rouge..."
              />
              <button
                type="button"
                onClick={addVariant}
                className="btn-outline flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            {variants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {variants.map((variant, index) => (
                  <span
                    key={`${variant}-${index}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700"
                  >
                    {variant}
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700"
                      aria-label={`Supprimer la variante ${variant}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Images du produit</label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Cliquer pour televerser des images</p>
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
                      alt={`Produit ${index + 1}`}
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
              {isSubmitting ? 'Creation...' : 'Creer le produit'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

