import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  sku?: string
  variant?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string, variant?: string) => void
  updateQuantity: (id: string, quantity: number, variant?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items
        const existingItem = items.find(
          (i) => i.id === item.id && (i.variant || '') === (item.variant || '')
        )

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id && (i.variant || '') === (item.variant || '')
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] })
        }
      },
      removeItem: (id, variant) => {
        set({
          items: get().items.filter(
            (item) => !(item.id === id && (item.variant || '') === (variant || ''))
          ),
        })
      },
      updateQuantity: (id, quantity, variant) => {
        if (quantity <= 0) {
          get().removeItem(id, variant)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === id && (item.variant || '') === (variant || '')
              ? { ...item, quantity }
              : item
          ),
        })
      },
      clearCart: () => {
        set({ items: [] })
      },
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

