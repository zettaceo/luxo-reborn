import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { createSlug } from '@/lib/utils'

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    const { error } = await supabaseAdmin
      .from('products')
      .update({
        name:         body.name,
        slug:         createSlug(body.name),
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
      await supabaseAdmin.from('product_images').insert(imgs)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await supabaseAdmin.from('product_images').delete().eq('product_id', params.id)
    await supabaseAdmin.from('products').delete().eq('id', params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}
