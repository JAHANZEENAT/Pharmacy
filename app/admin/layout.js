'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/admin/login'

    return (
        <div className="flex min-h-screen bg-gray-50/50 transition-colors">
            {!isLoginPage && <Sidebar />}
            <div className="flex-1 flex flex-col min-w-0">
                <main className={isLoginPage ? "flex-1" : "flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto p-4 md:p-8"}>
                    {children}
                </main>
            </div>
        </div>
    )
}
