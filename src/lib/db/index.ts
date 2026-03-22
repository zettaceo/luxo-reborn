// ══════════════════════════════════════════════
// CAMADA DE ABSTRAÇÃO DO BANCO DE DADOS
// Para migrar para VPS: só mude este arquivo.
// O resto do projeto não precisa mudar.
// ══════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client público — para uso no frontend (respeita RLS)
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Client admin — para API Routes que precisam de acesso total (bypassa RLS)
// NUNCA exponha supabaseAdmin no frontend
export const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── HELPERS DE PRODUTO ────────────────────────
export const db = {
  products: {
    async findMany({ category, featured, limit, page }: {
      category?: string
      featured?: boolean
      limit?: number
      page?: number
    } = {}) {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (category)  query = query.eq('categories.slug', category)
      if (featured)  query = query.eq('is_featured', true)
      if (limit)     query = query.limit(limit)
      if (page && limit) query = query.range((page-1)*limit, page*limit - 1)

      const { data, error } = await query
      if (error) throw error
      return data
    },

    async findBySlug(slug: string) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          reviews(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (error) throw error
      return data
    },

    async findById(id: string) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*, category:categories(*), images:product_images(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  },

  categories: {
    async findAll() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  },

  orders: {
    async create(order: Record<string, unknown>) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert(order)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async findByEmail(email: string) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async findById(id: string) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    async updatePaymentStatus(paymentId: string, status: string, orderId: string) {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: status,
          payment_id: paymentId,
          status: status === 'approved' ? 'paid' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
      if (error) throw error
    },

    async updateTracking(id: string, trackingCode: string, shippingService: string) {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          tracking_code: trackingCode,
          shipping_service: shippingService,
          status: 'shipped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },

    // Listagem para o admin
    async adminList({ status, page = 1, limit = 20 }: {
      status?: string; page?: number; limit?: number
    } = {}) {
      let query = supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page-1)*limit, page*limit - 1)

      if (status) query = query.eq('status', status)

      const { data, error, count } = await query
      if (error) throw error
      return { data, total: count ?? 0 }
    },
  },

  reviews: {
    async create(review: Record<string, unknown>) {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async approve(id: string) {
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', id)
      if (error) throw error
    },
  },

  dashboard: {
    async getStats() {
      const today = new Date()
      today.setHours(0,0,0,0)

      const [ordersToday, ordersMonth, ordersPending, lowStock] = await Promise.all([
        supabaseAdmin.from('orders').select('total', { count: 'exact' })
          .gte('created_at', today.toISOString()).eq('payment_status', 'approved'),
        supabaseAdmin.from('orders').select('total', { count: 'exact' })
          .gte('created_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString())
          .eq('payment_status', 'approved'),
        supabaseAdmin.from('orders').select('*', { count: 'exact' })
          .eq('status', 'paid'),
        supabaseAdmin.from('products').select('*', { count: 'exact' })
          .lt('stock', 5).eq('is_active', true),
      ])

      const revenueToday = ordersToday.data?.reduce((s,o) => s + Number(o.total), 0) ?? 0
      const revenueMonth = ordersMonth.data?.reduce((s,o) => s + Number(o.total), 0) ?? 0

      return {
        total_orders_today: ordersToday.count ?? 0,
        revenue_today: revenueToday,
        total_orders_month: ordersMonth.count ?? 0,
        revenue_month: revenueMonth,
        orders_pending: ordersPending.count ?? 0,
        low_stock_products: lowStock.count ?? 0,
      }
    }
  }
}
