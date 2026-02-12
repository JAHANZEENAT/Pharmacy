'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import StoreTabs from '@/components/admin/StoreTabs'
import { Search, Bell, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminStoresPage() {
    const { user, getToken, loading: authLoading } = useAuth()
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (authLoading) return
        if (!user || user.role !== 'admin') {
            router.push('/admin/login')
            return
        }
        fetchStores()
    }, [user, authLoading, router])

    const fetchStores = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
            setLoading(true)
            const token = getToken()
            const res = await fetch('/api/admin/users?role=pharmacist', {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            })
            const data = await res.json()
            setStores(data.users || [])
        } catch (error) {
            console.error('Fetch stores error:', error)
            if (error.name === 'AbortError') {
                toast.error('Stores request timed out')
            } else {
                toast.error('Failed to load stores')
            }
        } finally {
            clearTimeout(timeoutId)
            setLoading(false)
        }
    }

    if (authLoading || (!user && loading)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pharmacy Stores</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage all pharmacy stores across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-500" onClick={fetchStores}>
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-500">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <StoreTabs stores={stores} loading={loading} onRefresh={fetchStores} />
        </div>
    )
}
