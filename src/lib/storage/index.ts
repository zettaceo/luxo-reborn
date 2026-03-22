// ══════════════════════════════════════════════
// STORAGE — Upload de imagens de produtos
// Usa Supabase Storage (pode trocar por S3/VPS)
// ══════════════════════════════════════════════

import { supabaseAdmin } from '@/lib/db'

const BUCKET = 'products'

// ── UPLOAD DE IMAGEM ─────────────────────────
export async function uploadProductImage(
  file: File | Buffer,
  productId: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${productId}/${Date.now()}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: false,
    })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ── DELETAR IMAGEM ───────────────────────────
export async function deleteProductImage(url: string): Promise<void> {
  // Extrai o path da URL pública
  const path = url.split(`/storage/v1/object/public/${BUCKET}/`)[1]
  if (!path) return

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path])

  if (error) console.error('Erro ao deletar imagem:', error)
}

// ── GARANTIR QUE O BUCKET EXISTE ─────────────
export async function ensureBucketExists() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)

  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
  }
}
