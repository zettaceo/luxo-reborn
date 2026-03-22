import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { generateUniqueProductSlug } from '@/lib/db/productSlug'
import { isAdminRequest } from '@/lib/auth/admin'

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    if (error.message.includes('products_slug_key')) {
      return 'Já existe um produto com nome parecido. Ajuste o nome e tente novamente.'
    }
    return error.message
  }
  return 'Erro ao criar produto'
}

// POST /api/admin/products — cria produto com imagens
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 })
    }

    const slug = await generateUniqueProductSlug(body.name)

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
      const { error: imageError } = await supabaseAdmin.from('product_images').insert(imgs)
      if (imageError) throw imageError
    }

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
