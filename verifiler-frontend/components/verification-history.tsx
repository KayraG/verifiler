"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { FileCheck, Search, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DocumentRecord, getVerificationHistory }from "@/lib/blockchain"
import freighterApi from "@stellar/freighter-api"


type SortField = "documentName" | "timestamp"
type SortDirection = "asc" | "desc"

export default function VerificationHistory() {
    const [searchTerm, setSearchTerm] = useState("")
    const [sortField, setSortField] = useState<SortField>("timestamp")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const [verifications, setVerifications] = useState<DocumentRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [walletConnected, setWalletConnected] = useState(false)

    // Check wallet connection and load history
    useEffect(() => {
        const checkWalletAndLoadHistory = async () => {
            try {
                const isConnected = await freighterApi.isConnected()
                if(!isConnected.error)
                    setWalletConnected(isConnected.isConnected);

                if (isConnected) {
                    await loadVerificationHistory()
                }
            } catch (err) {
                console.error("Error checking wallet connection:", err)
                setError("Failed to check wallet connection")
            }
        }

        checkWalletAndLoadHistory()
    }, [])

    // Load verification history
    const loadVerificationHistory = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const { address: publicKey } = await freighterApi.getAddress()
            if (!publicKey) {
                throw new Error("Could not get wallet address")
            }

            const history = await getVerificationHistory(publicKey)
            setVerifications(history.records);
        } catch (err) {
            console.error("Error loading verification history:", err)
            setError(err instanceof Error ? err.message : "Failed to load verification history")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const toggleRowExpansion = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id)
    }

    const filteredVerifications = verifications.filter(
        (v) =>
            v.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.documentHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.registeredBy.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const sortedVerifications = [...filteredVerifications].sort((a, b) => {
        if (sortField === "documentName") {
            return sortDirection === "asc"
                ? a.documentName.localeCompare(b.documentName)
                : b.documentName.localeCompare(a.documentName)
        } else {
            return sortDirection === "asc"
                ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        }
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <FileCheck className="mr-2 h-5 w-5" />
                    Verification History
                </CardTitle>
                <CardDescription>View all documents that have been registered on the blockchain</CardDescription>
            </CardHeader>
            <CardContent>
                {!walletConnected ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm mb-4">
                        Please connect your wallet to view your verification history.
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">{error}</div>
                ) : (
                    <>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by document name, hash or address..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">
                                            <Button
                                                variant="ghost"
                                                className="p-0 font-medium flex items-center"
                                                onClick={() => handleSort("documentName")}
                                            >
                                                Document Name
                                                {sortField === "documentName" &&
                                                    (sortDirection === "asc" ? (
                                                        <ChevronUp className="ml-1 h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="ml-1 h-4 w-4" />
                                                    ))}
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                className="p-0 font-medium flex items-center"
                                                onClick={() => handleSort("timestamp")}
                                            >
                                                Date
                                                {sortField === "timestamp" &&
                                                    (sortDirection === "asc" ? (
                                                        <ChevronUp className="ml-1 h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="ml-1 h-4 w-4" />
                                                    ))}
                                            </Button>
                                        </TableHead>
                                        <TableHead className="hidden md:table-cell">Status</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6">
                                                Loading verification history...
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedVerifications.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No verification records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedVerifications.map((verification) => (
                                            <React.Fragment key={verification.id}>
                                                <TableRow>
                                                    <TableCell className="font-medium">{verification.documentName}</TableCell>
                                                    <TableCell>{new Date(verification.timestamp).toLocaleDateString()}</TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                                                            Verified
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(verification.id)}>
                                                            {expandedRow === verification.id ? "Hide Details" : "View Details"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {expandedRow === verification.id && (
                                                    <TableRow key={`${verification.id}-details`}>
                                                        <TableCell colSpan={4} className="bg-muted/50">
                                                            <div className="p-2 space-y-2 text-sm">
                                                                <div className="grid grid-cols-[100px_1fr] gap-1">
                                                                    <div className="font-medium">Document Hash:</div>
                                                                    <div className="break-all">{verification.documentHash}</div>
                                                                </div>
                                                                <div className="grid grid-cols-[100px_1fr] gap-1">
                                                                    <div className="font-medium">Registered By:</div>
                                                                    <div className="break-all">{verification.registeredBy}</div>
                                                                </div>
                                                                <div className="grid grid-cols-[100px_1fr] gap-1">
                                                                    <div className="font-medium">Timestamp:</div>
                                                                    <div>{new Date(verification.timestamp).toLocaleString()}</div>
                                                                </div>
                                                                <div className="grid grid-cols-[100px_1fr] gap-1">
                                                                    <div className="font-medium">TX Hash:</div>
                                                                    <div className="break-all">{verification.txHash}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
