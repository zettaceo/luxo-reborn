import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth/admin'

// PUT /api/admin/reviews/[id] — aprovar ou atualizar avaliação
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: body.is_approved })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews/[id] — excluir avaliação
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir avaliação' }, { status: 500 })
  }
}
