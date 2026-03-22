'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/admin',           icon: '📊', label: 'Dashboard' },
  { href: '/admin/pedidos',   icon: '📦', label: 'Pedidos' },
  { href: '/admin/produtos',  icon: '🧸', label: 'Produtos' },
  { href: '/admin/avaliacoes',icon: '⭐', label: 'Avaliações' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open,   setOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-rose-light/40">
          <Image src="/images/logo.png" alt="Luxo Reborn" width={140} height={52} className="h-10 w-auto object-contain" />
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mt-1 pl-1">Admin Panel</p>
        </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, icon, label }) => {
          const isActive = href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-rose-deep to-rose text-white shadow-rose'
                  : 'text-charcoal hover:bg-rose-pale'
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-rose-light/40">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted hover:bg-rose-pale transition-colors mb-1"
        >
          <span>🛍️</span> Ver loja
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-rose-light flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-rose-light flex items-center justify-between px-4 h-14">
        <Image src="/images/logo.png" alt="Luxo Reborn" width={110} height={42} className="h-9 w-auto object-contain" />
        <button onClick={() => setOpen(o => !o)} className="text-2xl">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-56 bg-white flex flex-col h-full shadow-xl mt-14">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
