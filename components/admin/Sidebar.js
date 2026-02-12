'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingBag,
    Store,
    CreditCard,
    Users,
    MessageSquare,
    Settings,
    User,
    Palette,
    Layout,
    BookOpen,
    Sliders,
    Percent,
    ChevronRight,
    Shield
} from 'lucide-react'
import { cn } from "@/lib/utils"

const navItems = [
    {
        group: "Main", items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
            { label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
            { label: "Pharmacy Stores", icon: Store, href: "/admin/stores" },
            { label: "Accounting", icon: CreditCard, href: "/admin/accounting" },
            { label: "Customers", icon: Users, href: "/admin/customers" },
            { label: "Medicine Catalog", icon: Sliders, href: "/admin/medicines" },
            { label: "Product Reviews", icon: MessageSquare, href: "/admin/reviews" },
        ]
    },
    {
        group: "Settings", items: [
            { label: "Profile", icon: User, href: "/admin/profile" },
            { label: "Customize", icon: Palette, href: "/admin/customize" },
            { label: "Styling", icon: Layout, href: "/admin/styling" },
            { label: "CMS", icon: BookOpen, href: "/admin/cms" },
            { label: "Catalog", icon: Sliders, href: "/admin/catalog" },
            { label: "Configurations", icon: Sliders, href: "/admin/configurations" },
            { label: "Tax", icon: Percent, href: "/admin/tax" },
        ]
    }
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r bg-white flex flex-col md:flex lg:sticky lg:flex">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-blue-600">
                    <Shield className="h-6 w-6" />
                    <span className="text-xl tracking-tight text-slate-900">PharmaFlow</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
                {navItems.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            {group.group}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                            isActive
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn(
                                                "h-4 w-4",
                                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                            )} />
                                            {item.label}
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4" />}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">Admin</p>
                        <p className="text-xs text-slate-500 truncate">admin@pharmacy.com</p>
                    </div>
                    <Settings className="h-4 w-4 text-slate-400" />
                </div>
            </div>
        </aside>
    )
}
