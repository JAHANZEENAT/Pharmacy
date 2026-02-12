'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PharmacyHeader from '@/components/admin/PharmacyHeader'
import PharmacyDetailsCard from '@/components/admin/PharmacyDetailsCard'
import PharmacyProductCatalog from '@/components/admin/PharmacyProductCatalog'

export default function PharmacyProfilePage({ params }) {
    const { id } = params
    const [pharmacy, setPharmacy] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { getToken, user } = useAuth()
    const router = useRouter()

    const fetchPharmacy = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch(`/api/admin/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Pharmacy not found')
                } else if (response.status === 403) {
                    setError('Access denied (Admin required)')
                } else {
                    setError('Failed to load pharmacy details')
                }
                return
            }

            const data = await response.json()
            if (data.user) {
                setPharmacy(data.user)
            }
        } catch (err) {
            setError('An error occurred while fetching data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Wait for auth to initialize
        if (!user) return

        // Redirection check for non-admins
        if (user.role !== 'admin') {
            router.push('/dashboard')
            return
        }

        if (id) fetchPharmacy()
    }, [id, user])

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Fetching pharmacy profile...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
                <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{error}</h2>
                <p className="text-slate-500 max-w-md">There was a problem loading the profile for ID: {id}. Please check the ID or your permissions.</p>
                <button
                    onClick={() => router.push('/admin/stores')}
                    className="text-blue-600 font-semibold hover:underline mt-4"
                >
                    Back to Pharmacies List
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <PharmacyHeader pharmacy={pharmacy} />

            <div className="space-y-8">
                <PharmacyDetailsCard
                    pharmacy={pharmacy}
                    onRefresh={fetchPharmacy}
                />

                <PharmacyProductCatalog
                    pharmacistId={id}
                />
            </div>
        </div>
    )
}
