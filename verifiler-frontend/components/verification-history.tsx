"use client"

import * as React from "react"
import { useState } from "react"
import { FileCheck, Search, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Mock data for demonstration
const mockVerifications = [
    {
        id: "1",
        documentName: "Contract Agreement",
        documentHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        timestamp: "2025-05-28T14:32:10Z",
        registeredBy: "0x3a2d3246c2e1d8b9b1df7f8fb3b9c310c12b6f71",
        txHash: "0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b",
    },
    {
        id: "2",
        documentName: "Property Deed",
        documentHash: "0x2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3",
        timestamp: "2025-05-25T09:15:22Z",
        registeredBy: "0x3a2d3246c2e1d8b9b1df7f8fb3b9c310c12b6f71",
        txHash: "0x19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7",
    },
    {
        id: "3",
        documentName: "Medical Records",
        documentHash: "0xb5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c",
        timestamp: "2025-05-20T16:45:33Z",
        registeredBy: "0x7c1230b066a8bd89d5c3b18072d3dcc7a27fbdbc",
        txHash: "0x4bc2331e5d24b5c5c5547a5c1c6a4d3d7c5c5547a5c1c6a4d3d7c5c5547a5c1c",
    },
    {
        id: "4",
        documentName: "Patent Application",
        documentHash: "0x7d793037a0760186574b0282901c93a1c5a1bfa3c9ec4121d574dfec7864b7f1",
        timestamp: "2025-05-15T11:22:45Z",
        registeredBy: "0x3a2d3246c2e1d8b9b1df7f8fb3b9c310c12b6f71",
        txHash: "0x6b23c0d5f35d1b11f9b683f0b0a617355deb11277d91ae091d399c655b87940d",
    },
    {
        id: "5",
        documentName: "Research Paper",
        documentHash: "0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278",
        timestamp: "2025-05-10T08:12:19Z",
        registeredBy: "0x7c1230b066a8bd89d5c3b18072d3dcc7a27fbdbc",
        txHash: "0x8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
    },
]

type SortField = "documentName" | "timestamp"
type SortDirection = "asc" | "desc"

export default function VerificationHistory() {
    const [searchTerm, setSearchTerm] = useState("")
    const [sortField, setSortField] = useState<SortField>("timestamp")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

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

    const filteredVerifications = mockVerifications.filter(
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
                            {sortedVerifications.length === 0 ? (
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
            </CardContent>
        </Card>
    )
}
