'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Package,
    PlusCircle,
    ShoppingBag,
    FileText,
    BarChart3,
    Settings,
    User,
    ChevronRight,
    Shield,
    LogOut,
    Clock
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

const navItems = [
    {
        group: "Main", items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/pharmacist/dashboard" },
            { label: "Products", icon: Package, href: "/pharmacist/products" },
            { label: "Orders", icon: ShoppingBag, href: "/pharmacist/orders" },
            { label: "Prescriptions", icon: FileText, href: "/pharmacist/prescriptions" },
        ]
    },
    {
        group: "Inventory", items: [
            { label: "Add Product", icon: PlusCircle, href: "/pharmacist/products/add" },
            { label: "Low Stock", icon: Clock, href: "/pharmacist/products?filter=low_stock" },
        ]
    },
    {
        group: "Analytics", items: [
            { label: "Reports", icon: BarChart3, href: "/pharmacist/reports" },
        ]
    },
    {
        group: "Account", items: [
            { label: "Settings", icon: Settings, href: "/pharmacist/settings" },
        ]
    }
]

export default function PharmacistSidebar() {
    const pathname = usePathname()
    const { logout, user } = useAuth()

    return (
        <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r bg-white flex flex-col md:flex lg:sticky lg:flex z-50">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/pharmacist/dashboard" className="flex items-center gap-2 font-bold text-purple-600">
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
                                                ? "bg-purple-50 text-purple-600"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn(
                                                "h-4 w-4",
                                                isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"
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

            <div className="border-t p-4 space-y-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs uppercase">
                        {user?.name?.substring(0, 2) || 'PH'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Pharmacist'}</p>
                        <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">Approved Vendor</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </aside>
    )
}
