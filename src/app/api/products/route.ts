import { NextRequest, NextResponse } from 'next/server'
import { db, supabaseAdmin } from '@/lib/db'
import { createSlug } from '@/lib/utils'

// GET /api/products — lista produtos públicos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') ?? undefined
    const featured = searchParams.get('featured') === 'true'
    const limit    = parseInt(searchParams.get('limit') ?? '20')
    const page     = parseInt(searchParams.get('page') ?? '1')
    const search   = searchParams.get('q') ?? ''

    let query = supabaseAdmin
      .from('products')
      .select(`*, category:categories(*), images:product_images(*)`, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit - 1)

    if (category) query = query.eq('categories.slug', category)
    if (featured)  query = query.eq('is_featured', true)
    if (search)    query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      per_page: limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

// POST /api/products — cria produto (apenas admin)
export async function POST(req: NextRequest) {
  // Verificação simples de admin via header
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const slug = createSlug(body.name)

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name:          body.name,
        slug,
        description:   body.description,
        price:         body.price,
        old_price:     body.old_price ?? null,
        category_id:   body.category_id,
        stock:         body.stock,
        badge:         body.badge ?? null,
        weight_grams:  body.weight_grams ?? 500,
        is_featured:   body.is_featured ?? false,
        is_active:     body.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
