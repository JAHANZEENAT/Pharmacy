'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ShoppingBag,
    Package,
    Wallet,
    Calendar,
    Filter,
    Download,
    Loader2,
    ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ReportsPage() {
    const { user, getToken, loading: authLoading } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (authLoading) return
        if (!user || user.role !== 'pharmacist') {
            router.push('/operator/login')
            return
        }
        fetchReports()
    }, [user, authLoading])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setStats(data)
        } catch (error) {
            toast.error('Failed to load analytical data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs tracking-tighter">Calculating metrics...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business Reports</h1>
                    <p className="text-slate-500 mt-1">Detailed performance metrics and sales analysis for your pharmacy.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-200 h-11 px-6 font-bold text-slate-700">
                        <Download className="h-4 w-4 mr-2 text-slate-400" />
                        Export PDF
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 h-11 px-6 font-bold shadow-lg shadow-purple-100">
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* High-Level Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: Wallet, trend: '+12.5%', trendUp: true, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Avg Order Value', value: '₹1420', icon: TrendingUp, trend: '+5.2%', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Sales', value: stats?.totalOrders || 0, icon: ShoppingBag, trend: '+8.1%', trendUp: true, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Product Reach', value: stats?.publishedProducts || 0, icon: Package, trend: '-2.4%', trendUp: false, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((item, idx) => (
                    <Card key={idx} className="border-slate-200 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-2xl", item.bg)}>
                                    <item.icon className={cn("h-6 w-6", item.color)} />
                                </div>
                                <Badge className={cn(
                                    "font-black text-[10px] rounded-full border-none px-2",
                                    item.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                )}>
                                    {item.trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {item.trend}
                                </Badge>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{item.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Simple Visual: Sales Distribution */}
                <Card className="border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-lg font-black tracking-tight text-slate-800">Order Metrics (by Status)</CardTitle>
                        <CardDescription>Breakdown of orders processed in the current cycle</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            {[
                                { label: 'Delivered (Complete)', percentage: 70, color: 'bg-emerald-500', count: stats?.totalOrders || 0 },
                                { label: 'Pending Approval', percentage: 20, color: 'bg-amber-500', count: stats?.pendingOrders || 0 },
                                { label: 'Cancelled/Rejected', percentage: 10, color: 'bg-red-500', count: 0 },
                            ].map((row, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{row.label}</span>
                                        <span className="text-sm font-black text-slate-900">{row.count} orders</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <div
                                            className={cn("h-full transition-all duration-1000", row.color)}
                                            style={{ width: `${row.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50/30 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <Calendar className="h-3 w-3" />
                            Showing data for current month (Feb 2026)
                        </div>
                    </CardFooter>
                </Card>

                {/* Stock Vulnerability Report */}
                <Card className="border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-lg font-black tracking-tight text-slate-800">Inventory Health</CardTitle>
                        <CardDescription>Overview of product availability and vulnerabilities</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {[
                                { label: 'Healthy Stock', value: (stats?.totalProducts || 0) - (stats?.lowStockProducts || 0), desc: 'Products with >10 items', color: 'text-emerald-600' },
                                { label: 'Low Stock Risks', value: stats?.lowStockProducts || 0, desc: 'Critical: Under 10 items remaining', color: 'text-red-600 font-black' },
                                { label: 'Draft / Hidden', value: (stats?.totalProducts || 0) - (stats?.publishedProducts || 0), desc: 'Products not visible to customers', color: 'text-slate-400' },
                            ].map((stat, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900">{stat.label}</p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{stat.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={cn("text-2xl tracking-tighter", stat.color)}>{stat.value}</span>
                                        <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performing Medicines Placeholder */}
            <Card className="border-slate-200">
                <CardHeader className="border-b bg-slate-50/50 py-4">
                    <CardTitle className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        Highest Volume Medicines
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/30 border-b">
                                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Medicine Rank</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Total Sales</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Stock Velocity</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Revenue Contribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center font-black text-purple-600 text-xs shadow-sm">01</div>
                                            <span className="text-sm font-black text-slate-900">Paracetamol 500mg</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">142 units</td>
                                    <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-none">High</Badge></td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 tracking-tighter">₹24,200</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center font-black text-purple-600 text-xs shadow-sm">02</div>
                                            <span className="text-sm font-black text-slate-900">Amoxicillin 250mg</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">89 units</td>
                                    <td className="px-6 py-4"><Badge className="bg-orange-100 text-orange-700 border-none">Medium</Badge></td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 tracking-tighter">₹18,450</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
