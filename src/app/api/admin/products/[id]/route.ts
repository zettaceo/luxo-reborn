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
  return 'Erro ao atualizar produto'
}

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 })
    }

    const slug = await generateUniqueProductSlug(body.name, params.id)

    const { error } = await supabaseAdmin
      .from('products')
      .update({
        name:         body.name,
        slug,
        description:  body.description,
        price:        body.price,
        old_price:    body.old_price ?? null,
        category_id:  body.category_id,
        stock:        body.stock,
        badge:        body.badge ?? null,
        weight_grams: body.weight_grams,
        is_featured:  body.is_featured,
        is_active:    body.is_active,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) throw error

    // Atualiza imagens: deleta antigas, insere novas
    await supabaseAdmin.from('product_images').delete().eq('product_id', params.id)

    if (body.images?.length) {
      const imgs = body.images.map((img: { url: string; is_cover: boolean; position: number }) => ({
        product_id: params.id,
        url:        img.url,
        is_cover:   img.is_cover,
        position:   img.position,
      }))
      const { error: imageError } = await supabaseAdmin.from('product_images').insert(imgs)
      if (imageError) throw imageError
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    await supabaseAdmin.from('product_images').delete().eq('product_id', params.id)
    await supabaseAdmin.from('products').delete().eq('id', params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}
