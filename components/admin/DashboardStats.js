'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import {
    Store,
    BadgeCheck,
    Users,
    ShoppingBag,
    Clock,
    IndianRupee,
    TrendingUp,
    Timer,
    XCircle
} from 'lucide-react'
import { cn } from "@/lib/utils"

export default function DashboardStats({ data }) {
    if (!data) return null;

    const sections = [
        {
            title: "Pharmacy Network",
            icon: Store,
            stats: [
                {
                    label: "Total Pharmacies",
                    value: data.totalPharmacies || "0",
                    icon: Store,
                    color: "text-blue-600",
                    bg: "bg-blue-50"
                },
                {
                    label: "Open Pharmacies",
                    value: data.openPharmacies || "0",
                    icon: BadgeCheck,
                    color: "text-green-600",
                    bg: "bg-green-50"
                },
                {
                    label: "Waiting (Pending)",
                    value: data.pendingPharmacies || "0",
                    icon: Timer,
                    color: "text-amber-600",
                    bg: "bg-amber-50"
                },
                {
                    label: "Rejected",
                    value: data.rejectedPharmacies || "0",
                    icon: XCircle,
                    color: "text-red-600",
                    bg: "bg-red-50"
                }
            ]
        },
        {
            title: "Platform Activity",
            icon: TrendingUp,
            stats: [
                {
                    label: "Total Customers",
                    value: data.totalCustomers || "0",
                    icon: Users,
                    color: "text-purple-600",
                    bg: "bg-purple-50"
                },
                {
                    label: "Total Orders",
                    value: data.totalOrders || "0",
                    icon: ShoppingBag,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50"
                },
                {
                    label: "Active Orders",
                    value: data.activeOrders || "0",
                    icon: Clock,
                    color: "text-amber-600",
                    bg: "bg-amber-50"
                }
            ]
        },
        {
            title: "Financial Overview",
            icon: IndianRupee,
            stats: [
                {
                    label: "Total Revenue",
                    value: `₹${data.totalRevenue?.toLocaleString() || "0"}`,
                    icon: IndianRupee,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50"
                },
                {
                    label: "Commission Earned",
                    value: `₹${data.commissionEarned?.toLocaleString() || "0"}`,
                    icon: TrendingUp,
                    color: "text-rose-600",
                    bg: "bg-rose-50"
                }
            ]
        }
    ]

    return (
        <div className="space-y-8">
            {sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <section.icon className="h-4 w-4 text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{section.title}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {section.stats.map((stat, idx) => (
                            <Card key={idx} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("p-2 rounded-lg transition-colors", stat.bg)}>
                                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
                                        <p className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
