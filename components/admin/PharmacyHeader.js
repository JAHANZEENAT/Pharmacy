'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Home, BadgeCheck, ShieldAlert, Ban } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PharmacyHeader({ pharmacy }) {
    const router = useRouter()

    if (!pharmacy) return null

    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                    <Home className="h-3.5 w-3.5" />
                    Dashboard
                </button>
                <span>/</span>
                <button
                    onClick={() => router.push('/admin/stores')}
                    className="hover:text-blue-600 transition-colors"
                >
                    Pharmacies
                </button>
                <span>/</span>
                <span className="text-slate-900 font-medium">{pharmacy.name}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900">{pharmacy.name}</h1>
                            {pharmacy.verificationStatus === 'approved' ? (
                                <BadgeCheck className="h-6 w-6 text-blue-500" />
                            ) : pharmacy.verificationStatus === 'rejected' ? (
                                <Ban className="h-6 w-6 text-red-500" />
                            ) : (
                                <ShieldAlert className="h-6 w-6 text-amber-500" />
                            )}
                        </div>
                        <p className="text-slate-500 text-sm">Pharmacy ID: {pharmacy.userId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge className={`px-3 py-1 text-sm border-none ${pharmacy.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                            pharmacy.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                        }`}>
                        {pharmacy.verificationStatus?.toUpperCase() || 'UNVERIFIED'}
                    </Badge>
                    <Badge variant="outline" className={`px-3 py-1 text-sm ${pharmacy.active ? 'border-green-200 text-green-600' : 'border-slate-200 text-slate-500'}`}>
                        {pharmacy.active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </div>
        </div>
    )
}
