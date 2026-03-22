import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth/admin'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData  = await req.formData()
    const file      = formData.get('file') as File
    const productId = (formData.get('product_id') as string) ?? 'temp'

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path   = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabaseAdmin.storage
      .from('products')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw error

    const { data } = supabaseAdmin.storage.from('products').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
  }
}
