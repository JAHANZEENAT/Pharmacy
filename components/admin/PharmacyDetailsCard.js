'use client'

import React, { useState } from 'react'
import {
    User,
    Mail,
    Phone,
    MapPin,
    FileText,
    Fingerprint,
    Calendar,
    Percent,
    ExternalLink,
    Download,
    Shield,
    AlertCircle,
    CheckCircle2,
    Ban
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function PharmacyDetailsCard({ pharmacy, onRefresh }) {
    const [commission, setCommission] = useState(pharmacy?.commission || 10)
    const [isEditingCommission, setIsEditingCommission] = useState(false)
    const [updating, setUpdating] = useState(false)
    const { getToken } = useAuth()

    const handleUpdate = async (updates) => {
        try {
            setUpdating(true)
            const token = getToken()
            const response = await fetch('/api/admin/users/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: pharmacy.userId,
                    updates
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Pharmacy updated successfully')
                if (onRefresh) onRefresh()
            } else {
                toast.error(data.error || 'Failed to update pharmacy')
            }
        } catch (error) {
            toast.error('An error occurred during update')
        } finally {
            setUpdating(false)
        }
    }

    const handleStatusUpdate = async (approved) => {
        try {
            setUpdating(true)
            const token = getToken()
            const response = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: pharmacy.userId,
                    approved
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success(approved ? 'Pharmacy approved' : 'Pharmacy rejected')
                if (onRefresh) onRefresh()
            } else {
                toast.error(data.error || 'Failed to update status')
            }
        } catch (error) {
            toast.error('An error occurred during status update')
        } finally {
            setUpdating(false)
        }
    }

    const isMock = (url) => {
        if (!url) return true
        const lowUrl = url.toLowerCase()
        return lowUrl.includes('mock') || !url.startsWith('http')
    }

    const handleOpen = (url) => {
        if (isMock(url)) {
            toast.error("This is legacy test data. Please register a new account to test Supabase storage.")
            return
        }
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    const handleDownload = async (url, baseFilename) => {
        if (isMock(url)) {
            toast.error("This is legacy test data. Please register a new account to test Supabase storage.")
            return
        }
        try {
            // Extract extension from URL
            const urlParts = url.split('/')
            const lastPart = urlParts[urlParts.length - 1].split('?')[0]
            const extMatch = lastPart.match(/\.([a-z0-9]+)$/i)
            const extension = extMatch ? extMatch[1] : 'pdf'
            const filename = `${baseFilename}.${extension}`

            const response = await fetch(url)
            if (!response.ok) throw new Error('Network response was not ok')
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('Download error:', error)
            // Fallback for Cloudinary: use fl_attachment flag to force download
            if (url.includes('cloudinary.com')) {
                const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/')
                window.open(downloadUrl, '_blank')
            } else {
                window.open(url, '_blank')
            }
            toast.info('Opening document in new tab...')
        }
    }

    if (!pharmacy) return null

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Personal & Verification Details
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="account-status"
                            checked={pharmacy.active}
                            onCheckedChange={(checked) => handleUpdate({ active: checked })}
                            disabled={updating}
                        />
                        <Label htmlFor="account-status" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {pharmacy.active ? 'Active' : 'Blocked'}
                        </Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Owner Name</p>
                                <p className="text-sm text-slate-900 font-bold">{pharmacy.ownerName || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Email Address</p>
                                <p className="text-sm text-slate-900">{pharmacy.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Phone Number</p>
                                <p className="text-sm text-slate-900">{pharmacy.phone || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Address</p>
                                <p className="text-sm text-slate-900 leading-relaxed">{pharmacy.address || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Joined Date</p>
                                <p className="text-sm text-slate-900">
                                    {pharmacy.createdAt ? new Date(pharmacy.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Verification & Commission */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Fingerprint className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Government ID / License No.</p>
                                <p className="text-sm text-slate-900">{pharmacy.licenseNumber || 'LIN_8829102'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Pharmacy License</p>
                                        <p className="text-[10px] text-slate-500">{pharmacy.licenseNumber || 'License Certification'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {pharmacy.licenseUrl && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                onClick={() => handleOpen(pharmacy.licenseUrl)}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                onClick={() => handleDownload(pharmacy.licenseUrl, `license_${pharmacy.userId}`)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {pharmacy.idProofUrl && (
                                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Govt ID Proof</p>
                                            <p className="text-[10px] text-slate-500">{pharmacy.gstNumber ? `GST: ${pharmacy.gstNumber}` : 'Verification Document'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-purple-600"
                                            onClick={() => handleOpen(pharmacy.idProofUrl)}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-purple-600"
                                            onClick={() => handleDownload(pharmacy.idProofUrl, `id_proof_${pharmacy.userId}`)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Commission Percentage</p>
                            <div className="flex items-center gap-2">
                                {isEditingCommission ? (
                                    <>
                                        <div className="relative w-24">
                                            <Input
                                                type="number"
                                                value={commission}
                                                onChange={(e) => setCommission(e.target.value)}
                                                className="h-9 pr-8"
                                            />
                                            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <Button
                                            size="sm"
                                            className="h-9 bg-blue-600"
                                            onClick={() => {
                                                handleUpdate({ commission: Number(commission) })
                                                setIsEditingCommission(false)
                                            }}
                                            disabled={updating}
                                        >
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between w-full p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                        <span className="text-lg font-bold text-blue-700">{pharmacy.commission || '10'}%</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-blue-600 hover:bg-blue-100 font-semibold"
                                            onClick={() => setIsEditingCommission(true)}
                                            disabled={updating}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Verification Status:</span>
                        <Badge className={`capitalize ${pharmacy.verificationStatus === 'approved' ? 'bg-green-100 text-green-700 border-none' :
                            pharmacy.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700 border-none' :
                                'bg-red-100 text-red-700 border-none'
                            }`}>
                            {pharmacy.verificationStatus}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {pharmacy.verificationStatus === 'pending' && (
                            <>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 h-10 px-6 gap-2"
                                    onClick={() => handleStatusUpdate(true)}
                                    disabled={updating}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve Pharmacy
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-10 px-6 gap-2"
                                    onClick={() => handleStatusUpdate(false)}
                                    disabled={updating}
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    Reject Application
                                </Button>
                            </>
                        )}
                        {pharmacy.verificationStatus === 'approved' && (
                            <Button
                                variant="outline"
                                className="text-slate-600 border-slate-200 hover:bg-slate-50 h-10 px-6 gap-2"
                                onClick={() => handleStatusUpdate(false)}
                                disabled={updating}
                            >
                                <Ban className="h-4 w-4" />
                                Revoke Approval
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
