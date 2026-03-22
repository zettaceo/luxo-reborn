// ══════════════════════════════════════════════
// LUXO REBORN — Types centralizados
// ══════════════════════════════════════════════

// ── PRODUTO ──────────────────────────────────
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  old_price?: number
  category_id: string
  category?: Category
  images: ProductImage[]
  stock: number
  is_active: boolean
  is_featured: boolean
  badge?: string | null         // "Novo", "Top", "Promoção"
  weight_grams?: number         // para cálculo de frete
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  position: number
  is_cover: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string
  description?: string
  product_count?: number
}

// ── CARRINHO ─────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
  subtotal: number
  item_count: number
}

// ── PEDIDO ───────────────────────────────────
export type OrderStatus =
  | 'pending'       // aguardando pagamento
  | 'paid'          // pago — aguardando envio
  | 'shipped'       // enviado
  | 'delivered'     // entregue
  | 'cancelled'     // cancelado
  | 'refunded'      // estornado

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card'

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Order {
  id: string
  order_number: string           // #LR-00001 (legível para cliente)
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string

  // Endereço
  address_zip: string
  address_street: string
  address_number: string
  address_complement?: string
  address_neighborhood: string
  address_city: string
  address_state: string

  // Itens
  items: OrderItem[]

  // Financeiro
  subtotal: number
  shipping_cost: number
  discount?: number
  total: number

  // Pagamento
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_id?: string            // ID do Mercado Pago
  pix_qr_code?: string
  pix_qr_code_base64?: string
  pix_expiration?: string

  // Envio
  status: OrderStatus
  tracking_code?: string
  shipping_service?: string      // "PAC", "SEDEX", etc.

  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string           // snapshot no momento da compra
  product_image?: string
  quantity: number
  unit_price: number
  total_price: number
}

// ── AVALIAÇÃO ────────────────────────────────
export interface Review {
  id: string
  product_id: string
  order_id?: string
  customer_name: string
  customer_email?: string
  rating: number                 // 1 a 5
  comment?: string
  is_approved: boolean
  created_at: string
}

// ── CLIENTE ──────────────────────────────────
export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  cpf?: string
  created_at: string
}

// ── FRETE ────────────────────────────────────
export interface ShippingOption {
  service: string               // "PAC", "SEDEX", "Mini Envios"
  name: string
  price: number
  estimated_days: number
}

// ── API RESPONSES ────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ── FORMULÁRIOS ──────────────────────────────
export interface CheckoutForm {
  name: string
  email: string
  phone: string
  cpf: string
  zip: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  payment_method: PaymentMethod
  // Cartão
  card_number?: string
  card_name?: string
  card_expiry?: string
  card_cvv?: string
  card_installments?: number
}

export interface ProductForm {
  name: string
  description: string
  price: number
  old_price?: number
  category_id: string
  stock: number
  badge?: string
  weight_grams?: number
  is_featured: boolean
  is_active: boolean
}

// ── DASHBOARD ADMIN ──────────────────────────
export interface DashboardStats {
  total_orders_today: number
  revenue_today: number
  total_orders_month: number
  revenue_month: number
  orders_pending: number
  orders_to_ship: number
  low_stock_products: number
  total_customers: number
}
