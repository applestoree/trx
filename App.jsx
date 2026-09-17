import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './styles.css'

const API_BASE = 'https://jhpbtooefyzdndstlzva.supabase.co/functions/v1'
const PRODUCTS_ENDPOINT = `${API_BASE}/get-trx-products`
const CART_KEY = 'apple-store-malaysia-cart'
const USER_KEY = 'apple-store-malaysia-user'

const icons = {
  home: '⌂',
  products: '▦',
  cart: '⌁',
  user: '◯',
  back: '‹',
  search: '⌕',
  plus: '+',
  minus: '−',
  close: '×',
  chevron: '›',
  check: '✓',
}

function Icon({ name, size = 20 }) {
  return <span className={`text-icon text-icon-${name}`} style={{ fontSize: size }} aria-hidden="true">{icons[name]}</span>
}

function money(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'RM —'
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 2 }).format(number)
}

function effectivePrice(item) {
  const sale = Number(item?.sale_price)
  const price = Number(item?.price)
  return Number.isFinite(sale) ? sale : price
}

function firstImage(item) {
  return item?.image_link || item?.variant_color?.image_link || ''
}

function getCardPrice(card) {
  return {
    price: card?.price,
    sale_price: card?.sale_price,
  }
}

function getDetailPrice(variant) {
  return {
    price: variant?.variant_size?.price ?? variant?.price,
    sale_price: variant?.variant_size?.sale_price ?? variant?.sale_price,
  }
}

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is optional; the current UI remains usable for the session.
  }
}

function routeState() {
  const url = new URL(window.location.href)
  return {
    path: url.pathname,
    itemGroupId: url.searchParams.get('item_group_id'),
    variantsId: url.searchParams.get('variantsId'),
  }
}

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function apiUrl(itemGroupId, id) {
  const params = new URLSearchParams()
  if (itemGroupId) params.set('item_group_id', itemGroupId)
  if (id) params.set('id', id)
  const query = params.toString()
  return query ? `${PRODUCTS_ENDPOINT}?${query}` : PRODUCTS_ENDPOINT
}

async function requestProducts(itemGroupId, id, signal) {
  const response = await fetch(apiUrl(itemGroupId, id), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success || !Array.isArray(payload?.data)) {
    const message = payload?.error?.message || 'Product API request failed.'
    const error = new Error(message)
    error.code = payload?.error?.code || `HTTP_${response.status}`
    throw error
  }
  return payload
}

function productFromDetail(item) {
  return item?.productdetailpage || null
}

function Header({ cartCount, onCart }) {
  return (
    <header className="app-header">
      <button className="brand-button" onClick={() => navigate('/')} aria-label="Apple Store Malaysia home">
        <span className="brand-mark"></span>
        <span>Apple Store Malaysia</span>
      </button>
      <button className="header-cart" onClick={onCart} aria-label="Shopping cart">
        <Icon name="cart" size={21} />
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>
    </header>
  )
}

function BottomNav({ path, cartCount }) {
  const active = path === '/' ? 'home' : path.startsWith('/products') ? 'products' : path === '/cart' || path === '/checkout' ? 'cart' : 'user'
  const items = [
    ['home', 'Home', '/'],
    ['products', 'Products', '/products'],
    ['cart', 'Cart', '/cart'],
    ['user', 'Profile', '/profile'],
  ]
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(([key, label, href]) => (
        <button key={key} className={active === key ? 'active' : ''} onClick={() => navigate(href)}>
          <span className="nav-icon-wrap"><Icon name={key} size={21} />{key === 'cart' && cartCount > 0 && <span className="nav-badge">{cartCount}</span>}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function HeroBanner({ onShop }) {
  return (
    <section className="hero-banner">
      <div>
        <span className="eyebrow">APPLE STORE MALAYSIA</span>
        <h1>Discover your<br />next Apple.</h1>
        <p>Explore the latest products and choose the configuration that fits you.</p>
        <button className="primary-button hero-button" onClick={onShop}>Shop products</button>
      </div>
      <div className="hero-apple" aria-hidden="true"></div>
    </section>
  )
}

function ProductCard({ card, onOpen, onAdd }) {
  const { price, sale_price } = getCardPrice(card)
  const hasSale = sale_price !== null && sale_price !== undefined && sale_price !== '' && Number.isFinite(Number(sale_price))
  const label = card?.custom_label_0
  return (
    <article className="product-card">
      <button className="product-image-button" onClick={() => onOpen(card.item_group_id)} aria-label={`View ${card.title || 'product'}`}>
        {firstImage(card) ? <img src={firstImage(card)} alt={card.title || 'Product'} loading="lazy" /> : <div className="image-placeholder"></div>}
        {label && <span className="sale-label">{label}</span>}
      </button>
      <div className="product-card-body">
        <span className="product-type">{card?.product_type || ''}</span>
        <h3>{card?.title || 'Product'}</h3>
        <div className="price-row">
          <strong>{money(hasSale ? sale_price : price)}</strong>
          {hasSale && <span>{money(price)}</span>}
        </div>
        <button className="add-button" onClick={() => onAdd(card)} aria-label={`Add ${card.title || 'product'} to cart`}><Icon name="plus" size={18} /></button>
      </div>
    </article>
  )
}

function ProductGrid({ cards, onOpen, onAdd }) {
  if (!cards.length) return <SkeletonNotFound />
  return <div className="product-grid">{cards.map((card, index) => <ProductCard key={`${card.item_group_id || 'product'}-${index}`} card={card} onOpen={onOpen} onAdd={onAdd} />)}</div>
}

function SkeletonNotFound({ message = 'Products not found' }) {
  return (
    <section className="empty-state">
      <div className="empty-icon"></div>
      <h2>{message}</h2>
      <p>The product API returned no usable product data.</p>
    </section>
  )
}

function LoadingState() {
  return <div className="loading-state"><div className="spinner" /><span>Loading products…</span></div>
}

function HomePage({ cards, loading, onOpen, onAdd }) {
  const categories = useMemo(() => [...new Set(cards.map((item) => item?.product_type).filter(Boolean))].slice(0, 6), [cards])
  return (
    <div className="page-content">
      <HeroBanner onShop={() => navigate('/products')} />
      <div className="section-heading"><h2>Shop by category</h2><button onClick={() => navigate('/products')}>See all</button></div>
      <div className="category-list">
        {categories.map((category) => <button key={category} onClick={() => navigate(`/products?category=${encodeURIComponent(category)}`)}>{category}<Icon name="chevron" size={16} /></button>)}
      </div>
      <div className="section-heading"><h2>Featured products</h2><button onClick={() => navigate('/products')}>See all</button></div>
      {loading ? <LoadingState /> : <ProductGrid cards={cards.slice(0, 6)} onOpen={onOpen} onAdd={onAdd} />}
    </div>
  )
}

function ProductListPage({ cards, loading, onOpen, onAdd }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const categories = useMemo(() => [...new Set(cards.map((item) => item?.product_type).filter(Boolean))], [cards])
  const filtered = useMemo(() => cards.filter((card) => {
    const matchesSearch = `${card?.title || ''} ${card?.description || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || card?.product_type === category
    return matchesSearch && matchesCategory
  }), [cards, category, search])
  return (
    <div className="page-content">
      <div className="page-title-row"><div><span className="eyebrow">CATALOG</span><h1>Products</h1></div></div>
      <div className="search-box"><Icon name="search" size={21} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" /></div>
      <div className="filter-row"><button className={category === 'all' ? 'filter active' : 'filter'} onClick={() => setCategory('all')}>All</button>{categories.map((item) => <button key={item} className={category === item ? 'filter active' : 'filter'} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {loading ? <LoadingState /> : <ProductGrid cards={filtered} onOpen={onOpen} onAdd={onAdd} />}
    </div>
  )
}

function ProductImageGallery({ variants, selectedVariant, onSelect }) {
  const images = []
  const selectedColor = selectedVariant?.variant_color
  if (selectedColor?.image_link) images.push(selectedColor.image_link)
  if (selectedColor?.additional_image_link) {
    const additional = Array.isArray(selectedColor.additional_image_link) ? selectedColor.additional_image_link : String(selectedColor.additional_image_link).split(',').map((value) => value.trim()).filter(Boolean)
    images.push(...additional)
  }
  if (!images.length) {
    for (const variant of variants) {
      const image = variant?.variant_color?.image_link || variant?.image_link
      if (image && !images.includes(image)) images.push(image)
    }
  }
  const [activeImage, setActiveImage] = useState(0)
  useEffect(() => setActiveImage(0), [selectedVariant?.id])
  return (
    <div className="gallery">
      <div className="gallery-main">{images[activeImage] ? <img src={images[activeImage]} alt="Product" /> : <div className="image-placeholder large"></div>}</div>
      {images.length > 1 && <div className="gallery-thumbs">{images.map((image, index) => <button className={index === activeImage ? 'selected' : ''} key={`${image}-${index}`} onClick={() => setActiveImage(index)}><img src={image} alt="Product thumbnail" /></button>)}</div>}
      <div className="variant-preview">{variants.map((variant) => <button key={variant.id} className={selectedVariant?.id === variant.id ? 'selected' : ''} onClick={() => onSelect(variant)} aria-label={`Select variant ${variant.id}`}><span className="color-dot" style={{ background: variant?.variant_color?.color || '#d2d2d7' }} /></button>)}</div>
    </div>
  )
}

function ProductDetailPage({ detail, variants, initialVariantId, onAdd }) {
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedVariant, setSelectedVariant] = useState(null)

  const colors = useMemo(() => [...new Set(variants.map((variant) => variant?.variant_color?.color).filter(Boolean))], [variants])
  const sizesForColor = useMemo(() => {
    if (!selectedColor) return []
    return [...new Set(variants.filter((variant) => variant?.variant_color?.color === selectedColor).map((variant) => variant?.variant_size?.size).filter(Boolean))]
  }, [selectedColor, variants])

  useEffect(() => {
    const fromUrl = initialVariantId ? variants.find((variant) => String(variant?.id) === String(initialVariantId)) : null
    const first = fromUrl || variants[0] || null
    setSelectedVariant(first)
    setSelectedColor(first?.variant_color?.color || '')
    setSelectedSize(first?.variant_size?.size || '')
  }, [initialVariantId, variants])

  useEffect(() => {
    if (!selectedColor || !selectedSize) return
    const resolved = variants.find((variant) => variant?.variant_color?.color === selectedColor && variant?.variant_size?.size === selectedSize)
    setSelectedVariant(resolved || null)
  }, [selectedColor, selectedSize, variants])

  const selectColor = (color) => {
    setSelectedColor(color)
    const firstSize = variants.find((variant) => variant?.variant_color?.color === color)?.variant_size?.size || ''
    setSelectedSize(firstSize)
  }

  const price = selectedVariant ? getDetailPrice(selectedVariant) : { price: null, sale_price: null }
  const hasSale = price.sale_price !== null && price.sale_price !== undefined && price.sale_price !== '' && Number.isFinite(Number(price.sale_price))
  const availability = detail?.availability

  const addSelected = () => {
    if (!selectedVariant) return
    onAdd({
      productId: `${detail?.item_group_id || 'product'}-${selectedVariant.id}`,
      item_group_id: detail?.item_group_id,
      title: detail?.title,
      image: selectedVariant?.variant_color?.image_link || selectedVariant?.image_link || '',
      price: price.price,
      sale_price: price.sale_price,
      quantity: 1,
      variant: selectedVariant,
    })
  }

  return (
    <div className="page-content detail-page">
      <button className="back-button" onClick={() => navigate('/products')}><Icon name="back" size={29} /> Products</button>
      <ProductImageGallery variants={variants} selectedVariant={selectedVariant} onSelect={(variant) => { setSelectedVariant(variant); setSelectedColor(variant?.variant_color?.color || ''); setSelectedSize(variant?.variant_size?.size || '') }} />
      <div className="detail-info">
        <span className="product-type">{detail?.product_type || ''}</span>
        <h1>{detail?.title || 'Product'}</h1>
        {detail?.description && <p className="detail-description">{detail.description}</p>}
        <div className="detail-price">{money(hasSale ? price.sale_price : price.price)} {hasSale && <del>{money(price.price)}</del>}</div>
        {availability !== undefined && availability !== null && <div className="availability">{String(availability)}</div>}
        {colors.length > 0 && <section className="selector-section"><div className="selector-heading"><strong>Color</strong><span>{selectedColor}</span></div><div className="color-options">{colors.map((color) => <button key={color} className={selectedColor === color ? 'color-option selected' : 'color-option'} onClick={() => selectColor(color)}><span className="color-dot" style={{ background: color || '#d2d2d7' }} />{color}</button>)}</div></section>}
        {sizesForColor.length > 0 && <section className="selector-section"><div className="selector-heading"><strong>Size</strong><span>{selectedSize}</span></div><div className="size-options">{[...new Set(variants.map((variant) => variant?.variant_size?.size).filter(Boolean))].map((size) => { const available = sizesForColor.includes(size); return <button key={size} disabled={!available} className={selectedSize === size ? 'size-option selected' : 'size-option'} onClick={() => setSelectedSize(size)}>{size}</button> })}</div></section>}
        <button className="primary-button add-to-cart" disabled={!selectedVariant} onClick={addSelected}>Add to cart</button>
      </div>
    </div>
  )
}

function CartPage({ cart, onQuantity, onRemove }) {
  const subtotal = cart.reduce((sum, item) => sum + effectivePrice(item) * item.quantity, 0)
  return (
    <div className="page-content">
      <div className="page-title-row"><div><span className="eyebrow">YOUR BAG</span><h1>Cart</h1></div></div>
      {!cart.length ? <SkeletonNotFound message="Your cart is empty" /> : <>
        <div className="cart-list">{cart.map((item) => <div className="cart-item" key={item.productId}><div className="cart-image">{item.image ? <img src={item.image} alt={item.title} /> : <span></span>}</div><div className="cart-item-info"><h3>{item.title}</h3><p>{item.variant?.variant_color?.color || ''}{item.variant?.variant_size?.size ? ` · ${item.variant.variant_size.size}` : ''}</p><strong>{money(effectivePrice(item))}</strong><div className="quantity"><button onClick={() => onQuantity(item.productId, Math.max(1, item.quantity - 1))}><Icon name="minus" size={15} /></button><span>{item.quantity}</span><button disabled={item.quantity >= 10} onClick={() => onQuantity(item.productId, Math.min(10, item.quantity + 1))}><Icon name="plus" size={15} /></button></div></div><button className="remove-button" onClick={() => onRemove(item.productId)}><Icon name="close" size={19} /></button></div>)}</div>
        <div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Shipping and taxes, if applicable, are handled at checkout.</p><button className="primary-button" onClick={() => navigate('/checkout')}>Checkout</button></div>
      </>}
    </div>
  )
}

function CheckoutPage({ cart }) {
  const [customer, setCustomer] = useState(() => loadStorage(USER_KEY, { name: '', email: '', phone: '', address: '' }))
  const [payment, setPayment] = useState('DuitNow QR')
  const [submitted, setSubmitted] = useState(false)
  const subtotal = cart.reduce((sum, item) => sum + effectivePrice(item) * item.quantity, 0)
  const update = (field, value) => setCustomer((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    saveStorage(USER_KEY, customer)
    setSubmitted(true)
  }
  if (!cart.length) return <div className="page-content"><button className="back-button" onClick={() => navigate('/cart')}><Icon name="back" size={29} /> Cart</button><SkeletonNotFound message="Add products before checkout" /></div>
  if (submitted) return <div className="page-content confirmation"><div className="success-icon"><Icon name="check" size={30} /></div><span className="eyebrow">ORDER READY</span><h1>Checkout details saved.</h1><p>Your customer and payment details are ready. Connect the order endpoint here when its API contract is defined.</p><button className="primary-button" onClick={() => navigate('/cart')}>Back to cart</button></div>
  return (
    <div className="page-content checkout-page">
      <button className="back-button" onClick={() => navigate('/cart')}><Icon name="back" size={29} /> Cart</button>
      <span className="eyebrow">CHECKOUT</span><h1>Complete your order</h1>
      <form onSubmit={submit}>
        <section className="form-section"><h2>Customer</h2><label>Name<input required value={customer.name} onChange={(event) => update('name', event.target.value)} /></label><label>Email<input type="email" required value={customer.email} onChange={(event) => update('email', event.target.value)} /></label><label>Phone<input required value={customer.phone} onChange={(event) => update('phone', event.target.value)} /></label><label>Address<textarea required value={customer.address} onChange={(event) => update('address', event.target.value)} /></label></section>
        <section className="form-section"><h2>Payment method</h2>{['DuitNow QR', 'Bank transfer'].map((method) => <label className="radio-option" key={method}><input type="radio" name="payment" checked={payment === method} onChange={() => setPayment(method)} /> <span>{method}</span></label>)}</section>
        <section className="form-section order-summary"><h2>Order summary</h2>{cart.map((item) => <div key={item.productId}><span>{item.title} × {item.quantity}</span><strong>{money(effectivePrice(item) * item.quantity)}</strong></div>)}<div className="total"><span>Total</span><strong>{money(subtotal)}</strong></div></section>
        <button className="primary-button" type="submit">Place order</button>
      </form>
    </div>
  )
}

function ProfilePage() {
  const [user, setUser] = useState(() => loadStorage(USER_KEY, { name: '', email: '', phone: '', address: '' }))
  const [editing, setEditing] = useState(false)
  const save = (event) => { event.preventDefault(); saveStorage(USER_KEY, user); setEditing(false) }
  return (
    <div className="page-content profile-page"><div className="profile-header"><div className="profile-avatar"></div><span className="eyebrow">ACCOUNT</span><h1>{user.name || 'Apple Store customer'}</h1><p>{user.email || 'Customer profile'}</p></div>
      {editing ? <form className="profile-form" onSubmit={save}><label>Name<input value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} /></label><label>Email<input type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} /></label><label>Phone<input value={user.phone} onChange={(event) => setUser({ ...user, phone: event.target.value })} /></label><label>Address<textarea value={user.address} onChange={(event) => setUser({ ...user, address: event.target.value })} /></label><button className="primary-button" type="submit">Save profile</button></form> : <><div className="profile-card"><div><span>Name</span><strong>{user.name || 'Not set'}</strong></div><div><span>Email</span><strong>{user.email || 'Not set'}</strong></div><div><span>Phone</span><strong>{user.phone || 'Not set'}</strong></div><div><span>Address</span><strong>{user.address || 'Not set'}</strong></div></div><button className="secondary-button" onClick={() => setEditing(true)}>Edit profile</button><section className="order-history"><h2>Order history</h2><SkeletonNotFound message="No orders yet" /></section></>}
    </div>
  )
}

function AppShell() {
  const [route, setRoute] = useState(routeState)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [variants, setVariants] = useState([])
  const [cart, setCart] = useState(() => loadStorage(CART_KEY, []))

  useEffect(() => {
    const onPopState = () => setRoute(routeState())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => saveStorage(CART_KEY, cart), [cart])

  const loadCatalog = useCallback(async () => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const payload = await requestProducts(null, null, controller.signal)
      setCards(payload.data.map((item) => item?.card).filter(Boolean))
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setCards([])
        setError(requestError)
      }
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [])

  const loadDetail = useCallback(async (itemGroupId, variantId) => {
    if (!itemGroupId) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const payload = await requestProducts(itemGroupId, variantId || null, controller.signal)
      const item = payload.data?.[0]
      const nextDetail = productFromDetail(item)
      setDetail(nextDetail)
      setVariants(Array.isArray(nextDetail?.variants) ? nextDetail.variants : [])
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setDetail(null)
        setVariants([])
        setError(requestError)
      }
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const isDetail = route.path === '/products' && Boolean(route.itemGroupId)
    if (isDetail) loadDetail(route.itemGroupId, route.variantsId)
    else if (route.path === '/' || route.path === '/products') loadCatalog()
    else setLoading(false)
  }, [route.path, route.itemGroupId, route.variantsId, loadCatalog, loadDetail])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const addToCart = (item) => {
    setCart((current) => {
      const id = item.productId || `${item.item_group_id}-${item?.variant?.id || 'default'}`
      const existing = current.find((entry) => entry.productId === id)
      if (existing) return current.map((entry) => entry.productId === id ? { ...entry, quantity: Math.min(10, entry.quantity + 1) } : entry)
      return [...current, { productId: id, item_group_id: item.item_group_id, title: item.title, image: item.image || firstImage(item), price: item.price, sale_price: item.sale_price, quantity: 1, variant: item.variant || null }]
    })
    navigate('/cart')
  }
  const updateQuantity = (id, quantity) => setCart((current) => current.map((item) => item.productId === id ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) } : item))
  const removeCartItem = (id) => setCart((current) => current.filter((item) => item.productId !== id))

  let content
  if (route.path === '/products' && route.itemGroupId) {
    content = loading ? <LoadingState /> : detail ? <ProductDetailPage detail={detail} variants={variants} initialVariantId={route.variantsId} onAdd={addToCart} /> : <SkeletonNotFound message="Product not found" />
  } else if (route.path === '/products') {
    content = error ? <SkeletonNotFound message="Products not found" /> : <ProductListPage cards={cards} loading={loading} onOpen={(id) => navigate(`/products?item_group_id=${encodeURIComponent(id)}`)} onAdd={addToCart} />
  } else if (route.path === '/cart') content = <CartPage cart={cart} onQuantity={updateQuantity} onRemove={removeCartItem} />
  else if (route.path === '/checkout') content = <CheckoutPage cart={cart} />
  else if (route.path === '/profile') content = <ProfilePage />
  else content = error ? <SkeletonNotFound message="Products not found" /> : <HomePage cards={cards} loading={loading} onOpen={(id) => navigate(`/products?item_group_id=${encodeURIComponent(id)}`)} onAdd={addToCart} />

  return (
    <div className="app-shell">
      <Header cartCount={cartCount} onCart={() => navigate('/cart')} />
      <main className="shell-content">{content}</main>
      <BottomNav path={route.path} cartCount={cartCount} />
    </div>
  )
}

function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setReady(true), 500); return () => clearTimeout(timer) }, [])
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {})
  }, [])
  if (!ready) return <div className="splash-screen"><div className="splash-logo"></div><h1>Apple Store Malaysia</h1><p>Discover your next Apple.</p><div className="loading-dots" /></div>
  return <AppShell />
}

export default App
