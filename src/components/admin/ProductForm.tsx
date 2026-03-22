'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import type { Category, Product } from '@/types'

interface Props {
  categories: Category[]
  product?: Product
}

interface ImagePreview {
  file?: File
  url: string
  id?: string
  isCover: boolean
  uploading?: boolean
}

export default function ProductForm({ categories, product }: Props) {
  const router  = useRouter()
  const isEdit  = !!product

  const [name,        setName]        = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price,       setPrice]       = useState(product?.price?.toString() ?? '')
  const [oldPrice,    setOldPrice]    = useState(product?.old_price?.toString() ?? '')
  const [categoryId,  setCategoryId]  = useState(product?.category_id ?? '')
  const [stock,       setStock]       = useState(product?.stock?.toString() ?? '0')
  const [badge,       setBadge]       = useState(product?.badge ?? '')
  const [weight,      setWeight]      = useState(product?.weight_grams?.toString() ?? '500')
  const [isFeatured,  setIsFeatured]  = useState(product?.is_featured ?? false)
  const [isActive,    setIsActive]    = useState(product?.is_active ?? true)

  const [images, setImages] = useState<ImagePreview[]>(
    product?.images?.map(img => ({ url: img.url, id: img.id, isCover: img.is_cover })) ?? []
  )
  const [saving, setSaving] = useState(false)

  // ── Dropzone ──────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const previews: ImagePreview[] = acceptedFiles.map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      isCover: images.length === 0 && i === 0,
      uploading: true,
    }))
    setImages(prev => [...prev, ...previews])

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (product?.id) formData.append('product_id', product.id)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const { url } = await res.json()

        setImages(prev => {
          const idx = prev.findIndex(p => p.file === file)
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = { ...updated[idx], url, uploading: false }
          return updated
        })
      } catch {
        toast.error(`Erro ao enviar ${file.name}`)
        setImages(prev => prev.filter(p => p.file !== file))
      }
    }
  }, [images, product])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  function setCover(idx: number) {
    setImages(prev => prev.map((img, i) => ({ ...img, isCover: i === idx })))
  }

  function removeImage(idx: number) {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      // Se removeu a capa, define a primeira como capa
      if (prev[idx].isCover && next.length > 0) next[0].isCover = true
      return next
    })
  }

  function moveImage(from: number, to: number) {
    setImages(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  // ── Save ──────────────────────────────────────
  async function handleSave() {
    if (!name.trim())     { toast.error('Nome obrigatório'); return }
    if (!price || isNaN(Number(price))) { toast.error('Preço inválido'); return }
    if (!categoryId)      { toast.error('Selecione a categoria'); return }
    if (images.some(i => i.uploading)) { toast.error('Aguarde o upload das imagens'); return }

    setSaving(true)
    try {
      const body = {
        name, description, price: Number(price),
        old_price: oldPrice ? Number(oldPrice) : null,
        category_id: categoryId,
        stock: Number(stock),
        badge: badge || null,
        weight_grams: Number(weight),
        is_featured: isFeatured,
        is_active: isActive,
        images: images.map((img, i) => ({
          url: img.url, id: img.id, is_cover: img.isCover, position: i,
        })),
      }

      const url    = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      toast.success(isEdit ? 'Produto atualizado! ✅' : 'Produto criado! 🎉')
      router.push('/admin/produtos')
      router.refresh()
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!product) return
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`)) return
    setSaving(true)
    try {
      await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
      toast.success('Produto excluído')
      router.push('/admin/produtos')
      router.refresh()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── IMAGENS ── */}
      <section className="bg-white rounded-2xl border border-rose-light p-6">
        <h2 className="font-display text-lg font-bold text-charcoal mb-1">📸 Fotos do produto</h2>
        <p className="text-xs text-muted mb-4">Arraste as fotos ou clique para selecionar. A primeira marcada como "Capa" será a foto principal.</p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
            isDragActive
              ? 'border-rose-deep bg-rose-pale'
              : 'border-rose-light hover:border-rose hover:bg-rose-pale/50'
          }`}
        >
          <input {...getInputProps()} />
          <span className="text-4xl block mb-2">📁</span>
          <p className="text-sm font-medium text-charcoal">
            {isDragActive ? 'Solte as fotos aqui!' : 'Arraste fotos aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-muted mt-1">JPG, PNG ou WebP · máx. 5MB por foto</p>
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  img.isCover ? 'border-rose-deep shadow-rose' : 'border-rose-light'
                }`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-rose-deep border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Controls on hover */}
                <div className="absolute inset-0 bg-charcoal/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  {!img.isCover && (
                    <button
                      onClick={() => setCover(idx)}
                      className="text-[10px] font-bold bg-gold text-charcoal px-2 py-0.5 rounded-full"
                    >
                      ⭐ Capa
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(idx)}
                    className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full"
                  >
                    🗑️ Remover
                  </button>
                  <div className="flex gap-1">
                    {idx > 0 && (
                      <button onClick={() => moveImage(idx, idx-1)} className="text-white text-xs bg-white/20 rounded px-1">←</button>
                    )}
                    {idx < images.length - 1 && (
                      <button onClick={() => moveImage(idx, idx+1)} className="text-white text-xs bg-white/20 rounded px-1">→</button>
                    )}
                  </div>
                </div>

                {img.isCover && (
                  <span className="absolute top-1 left-1 badge badge-gold text-[9px] px-1.5">Capa</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── INFORMAÇÕES ── */}
      <section className="bg-white rounded-2xl border border-rose-light p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-charcoal">📝 Informações</h2>

        <div>
          <label className="label">Nome do produto *</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bebê Reborn Laura" />
        </div>

        <div>
          <label className="label">Descrição</label>
          <textarea
            className="input resize-none"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva o produto: tamanho, materiais, diferenciais..."
          />
        </div>

        <div>
          <label className="label">Categoria *</label>
          <select className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Selecione a categoria</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Badge (etiqueta)</label>
          <select className="input" value={badge} onChange={e => setBadge(e.target.value)}>
            <option value="">Sem badge</option>
            {['Novo', 'Top', 'Popular', 'Promoção', 'Especial'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── PREÇO E ESTOQUE ── */}
      <section className="bg-white rounded-2xl border border-rose-light p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-charcoal">💰 Preço e Estoque</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Preço de venda *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">R$</span>
              <input
                className="input pl-10"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
          <div>
            <label className="label">Preço original (riscado)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">R$</span>
              <input
                className="input pl-10"
                type="number"
                step="0.01"
                min="0"
                value={oldPrice}
                onChange={e => setOldPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <p className="text-xs text-muted mt-1">Aparece riscado, mostrando o desconto</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantidade em estoque *</label>
            <input
              className="input"
              type="number"
              min="0"
              value={stock}
              onChange={e => setStock(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Peso (gramas) — para frete</label>
            <input
              className="input"
              type="number"
              min="1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="500"
            />
          </div>
        </div>
      </section>

      {/* ── VISIBILIDADE ── */}
      <section className="bg-white rounded-2xl border border-rose-light p-6 space-y-3">
        <h2 className="font-display text-lg font-bold text-charcoal">👁️ Visibilidade</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsActive(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-rose-deep' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">Produto ativo</p>
            <p className="text-xs text-muted">Produto aparece na loja para os clientes</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsFeatured(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isFeatured ? 'bg-gold' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">⭐ Destaque na home</p>
            <p className="text-xs text-muted">Aparece na seção de produtos em destaque</p>
          </div>
        </label>
      </section>

      {/* ── ACTIONS ── */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-10 py-3.5">
          {saving ? '⏳ Salvando...' : isEdit ? '💾 Salvar alterações' : '🚀 Publicar produto'}
        </button>
        <button onClick={() => router.push('/admin/produtos')} className="btn-outline py-3.5">
          Cancelar
        </button>
        {isEdit && (
          <button onClick={handleDelete} disabled={saving} className="ml-auto btn-outline py-3.5 border-red-200 text-red-500 hover:bg-red-50">
            🗑️ Excluir produto
          </button>
        )}
      </div>
    </div>
  )
}
