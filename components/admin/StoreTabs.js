'use client'

import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import StoreTable from './StoreTable'

export default function StoreTabs({ stores = [], loading = false, onRefresh }) {
    const activeStores = stores.filter(s => s.verificationStatus === 'approved')
    const pendingStores = stores.filter(s => s.verificationStatus === 'pending')
    const blockedStores = stores.filter(s => s.verificationStatus === 'rejected')

    return (
        <div className="mt-8">
            <Tabs defaultValue="active" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-white border p-1 h-11">
                        <TabsTrigger value="active" className="h-9 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                            Active ({activeStores.length})
                        </TabsTrigger>
                        <TabsTrigger value="awaiting" className="h-9 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                            Awaiting Approval ({pendingStores.length})
                        </TabsTrigger>
                        <TabsTrigger value="blocked" className="h-9 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                            Blocked ({blockedStores.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="active" className="mt-0">
                    <StoreTable stores={activeStores} loading={loading} onRefresh={onRefresh} />
                </TabsContent>
                <TabsContent value="awaiting" className="mt-0">
                    <StoreTable stores={pendingStores} loading={loading} onRefresh={onRefresh} />
                </TabsContent>
                <TabsContent value="blocked" className="mt-0">
                    <StoreTable stores={blockedStores} loading={loading} onRefresh={onRefresh} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
