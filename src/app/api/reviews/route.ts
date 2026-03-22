import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

// POST /api/reviews — cliente cria avaliação (vai para aprovação)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { product_id, customer_name, customer_email, rating, comment, order_id } = body

    if (!product_id || !customer_name || !rating) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Nota inválida' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id,
        order_id:      order_id ?? null,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() ?? null,
        rating,
        comment:       comment?.trim() ?? null,
        is_approved:   false, // admin aprova antes de publicar
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao enviar avaliação' }, { status: 500 })
  }
}

// GET /api/reviews?product_id=xxx — lista avaliações aprovadas
export async function GET(req: NextRequest) {
  try {
    const productId = new URL(req.url).searchParams.get('product_id')
    if (!productId) return NextResponse.json({ error: 'product_id obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
  }
}
