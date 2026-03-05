import { ProductsService } from './products.service'
import { FirestoreService } from '../firebase/firestore.service'

describe('ProductsService (featured cache)', () => {
  let service: ProductsService
  let firestoreMock: Partial<FirestoreService>

  beforeEach(() => {
    firestoreMock = {
      findAll: jest.fn(),
    }
    service = new ProductsService(firestoreMock as FirestoreService)
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('caches featured results and returns cache on subsequent calls', async () => {
    const products = Array.from({ length: 10 }).map((_, i) => ({ id: `p${i}`, updatedAt: new Date(Date.now() - i * 1000) }))
    ;(firestoreMock.findAll as jest.Mock).mockResolvedValue(products)

    const first = await service.getFeatured()
    expect(first.length).toBe(4)
    expect(firestoreMock.findAll).toHaveBeenCalledTimes(1)

    const second = await service.getFeatured()
    expect(second).toBe(first) // same object reference from cache
    expect(firestoreMock.findAll).toHaveBeenCalledTimes(1)
  })

  it('expires cache after TTL and refetches', async () => {
    process.env.FEATURED_CACHE_TTL_SECONDS = '1'
    const productsA = Array.from({ length: 10 }).map((_, i) => ({ id: `a${i}`, updatedAt: new Date(Date.now() - i * 1000) }))
    const productsB = Array.from({ length: 10 }).map((_, i) => ({ id: `b${i}`, updatedAt: new Date(Date.now() - i * 1000) }))

    ;(firestoreMock.findAll as jest.Mock).mockResolvedValueOnce(productsA).mockResolvedValueOnce(productsB)

    const first = await service.getFeatured()
    expect(first[0].id).toBe('a0')
    expect(firestoreMock.findAll).toHaveBeenCalledTimes(1)

    // Advance time past TTL
    jest.advanceTimersByTime(1500)

    const second = await service.getFeatured()
    expect(second[0].id).toBe('b0')
    expect(firestoreMock.findAll).toHaveBeenCalledTimes(2)

    delete process.env.FEATURED_CACHE_TTL_SECONDS
  })

  it('deduplicates concurrent fetches', async () => {
    const products = Array.from({ length: 8 }).map((_, i) => ({ id: `p${i}`, updatedAt: new Date(Date.now() - i * 1000) }))
    let resolveFn: Function
    const p = new Promise((res) => { resolveFn = res })
    ;(firestoreMock.findAll as jest.Mock).mockReturnValue(p)

    // Trigger two concurrent calls
    const p1 = service.getFeatured()
    const p2 = service.getFeatured()

    // resolve underlying fetch
    resolveFn!(products)

    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toEqual(r2)
    expect(firestoreMock.findAll).toHaveBeenCalledTimes(1)
  })
})
