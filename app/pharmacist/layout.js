'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import PharmacistSidebar from '@/components/pharmacist/Sidebar'

export default function PharmacistLayout({ children }) {
    const pathname = usePathname()
    // The operator login is at /operator/login, which is NOT under /pharmacist segment usually.
    // Wait, let me check where it is.
    const isLoginPage = pathname === '/operator/login'

    return (
        <div className="flex min-h-screen bg-gray-50/50 transition-colors">
            {!isLoginPage && <PharmacistSidebar />}
            <div className="flex-1 flex flex-col min-w-0">
                <main className={isLoginPage ? "flex-1" : "flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto p-4 md:p-8"}>
                    {children}
                </main>
            </div>
        </div>
    )
}
