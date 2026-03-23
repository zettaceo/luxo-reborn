import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { calculateShippingQuotes } from '@/lib/shipping/quote'

type InputItem = {
  product_id?: string
  quantity?: number
}

function normalizeItems(items: unknown) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => item as InputItem)
    .map((item) => ({
      product_id: typeof item.product_id === 'string' ? item.product_id.trim() : '',
      quantity: Number(item.quantity ?? 0),
    }))
    .filter((item) => item.product_id && Number.isInteger(item.quantity) && item.quantity > 0)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const destinationZip = typeof body?.destination_zip === 'string' ? body.destination_zip : ''
    const items = normalizeItems(body?.items)

    if (destinationZip.replace(/\D/g, '').length !== 8 || items.length === 0) {
      return NextResponse.json({ error: 'Dados de frete inválidos.' }, { status: 400 })
    }

    const ids = Array.from(new Set(items.map((item) => item.product_id)))
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, is_active, weight_grams')
      .in('id', ids)

    if (error) throw error
    if (!products || products.length !== ids.length) {
      return NextResponse.json({ error: 'Produtos inválidos para cálculo de frete.' }, { status: 400 })
    }

    const productMap = new Map(products.map((product) => [product.id, product]))
    const shippingItems = items.map((item) => {
      const product = productMap.get(item.product_id)
      if (!product) throw new Error('Produto não encontrado')
      if (!product.is_active) throw new Error(`Produto "${product.name}" está inativo.`)
      if (Number(product.stock) < item.quantity) throw new Error(`Estoque insuficiente para "${product.name}".`)

      return {
        id: product.id,
        name: product.name,
        quantity: item.quantity,
        weight_grams: Number(product.weight_grams ?? 500),
        price: Number(product.price),
      }
    })

    const quotes = await calculateShippingQuotes({
      destinationZip,
      items: shippingItems,
    })

    if (quotes.length === 0) {
      return NextResponse.json({ error: 'Não foi possível calcular frete no momento.' }, { status: 502 })
    }

    return NextResponse.json({ data: quotes })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao calcular frete.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
