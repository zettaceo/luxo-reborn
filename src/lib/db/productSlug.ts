import { supabaseAdmin } from '@/lib/db'
import { createSlug } from '@/lib/utils'

function getBaseSlug(name: string) {
  const slug = createSlug(name ?? '').trim()
  return slug || `produto-${Date.now()}`
}

export async function generateUniqueProductSlug(name: string, ignoreProductId?: string) {
  const baseSlug = getBaseSlug(name)

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, slug')
    .like('slug', `${baseSlug}%`)

  if (error) throw error

  const usedSlugs = new Set(
    (data ?? [])
      .filter((row) => row.id !== ignoreProductId)
      .map((row) => row.slug)
  )

  if (!usedSlugs.has(baseSlug)) return baseSlug

  let index = 2
  let candidate = `${baseSlug}-${index}`

  while (usedSlugs.has(candidate)) {
    index += 1
    candidate = `${baseSlug}-${index}`
  }

  return candidate
}
