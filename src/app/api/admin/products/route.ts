import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { createSlug } from '@/lib/utils'

// POST /api/admin/products — cria produto com imagens
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slug = createSlug(body.name)

    // 1. Cria o produto
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name:         body.name,
        slug,
        description:  body.description ?? '',
        price:        body.price,
        old_price:    body.old_price ?? null,
        category_id:  body.category_id,
        stock:        body.stock ?? 0,
        badge:        body.badge ?? null,
        weight_grams: body.weight_grams ?? 500,
        is_featured:  body.is_featured ?? false,
        is_active:    body.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error

    // 2. Salva imagens
    if (body.images?.length) {
      const imgs = body.images.map((img: { url: string; is_cover: boolean; position: number }) => ({
        product_id: product.id,
        url:        img.url,
        is_cover:   img.is_cover,
        position:   img.position,
      }))
      await supabaseAdmin.from('product_images').insert(imgs)
    }

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
