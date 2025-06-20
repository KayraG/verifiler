"use client"

import type React from "react"

import { useState } from "react"
import { Upload, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateFileHash, verifyDocumentOnBlockchain } from "@/lib/soroban-client"

type VerificationStatus = "idle" | "verifying" | "verified" | "failed"

export default function VerifyDocument() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<VerificationStatus>("idle")
    const [verificationDetails, setVerificationDetails] = useState<{
        registeredBy: string
        registeredAt: string
        documentName: string
        txHash: string
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStatus("idle")
            setError(null)
        }
    }

    const handleVerify = async () => {
        if (!file) return

        try {
            setStatus("verifying")
            setError(null)

            // Calculate document hash
            const documentHash = await calculateFileHash(file)

            // Verify document on blockchain
            const result = await verifyDocumentOnBlockchain(documentHash)

            if (result.isVerified && result.registeredBy && result.registeredAt && result.documentName) {
                setStatus("verified")
                setVerificationDetails({
                    registeredBy: result.registeredBy,
                    registeredAt: result.registeredAt,
                    documentName: result.documentName,
                    txHash: documentHash,
                })
            } else {
                setStatus("failed")
            }
        } catch (err) {
            console.error("Error verifying document:", err)
            setError(err instanceof Error ? err.message : "Failed to verify document. Please try again.")
            setStatus("failed")
        }
    }

    const resetVerification = () => {
        setFile(null)
        setStatus("idle")
        setVerificationDetails(null)
        setError(null)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Verify Document</CardTitle>
                <CardDescription>Upload a document to verify if it has been registered on the blockchain</CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
                )}

                {status === "verified" ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
                            <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
                            <div>
                                <h3 className="font-semibold text-green-700">Document Verified</h3>
                                <p className="text-sm text-green-600">This document has been registered on the blockchain</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div>
                                <Label>Document Name</Label>
                                <p className="text-sm font-medium">{verificationDetails?.documentName}</p>
                            </div>
                            <div>
                                <Label>Registered By</Label>
                                <p className="text-sm font-medium break-all">{verificationDetails?.registeredBy}</p>
                            </div>
                            <div>
                                <Label>Registration Date</Label>
                                <p className="text-sm font-medium">
                                    {verificationDetails?.registeredAt && new Date(verificationDetails.registeredAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <Label>Transaction Hash</Label>
                                <p className="text-sm font-medium break-all">{verificationDetails?.txHash}</p>
                            </div>
                        </div>
                    </div>
                ) : status === "failed" ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                            <XCircle className="h-8 w-8 text-red-500 mr-2" />
                            <div>
                                <h3 className="font-semibold text-red-700">Verification Failed</h3>
                                <p className="text-sm text-red-600">This document has not been registered on the blockchain</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <p className="text-sm text-muted-foreground">
                                The document you uploaded either has been modified since registration or has never been registered on
                                our blockchain.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                            {file ? (
                                <div className="text-center">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="mt-2">
                                        Change File
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium mb-1">Drag and drop your file here</p>
                                    <p className="text-xs text-muted-foreground mb-3">Upload the document you want to verify</p>
                                    <Button variant="outline" onClick={() => document.getElementById("verify-file")?.click()}>
                                        Select File
                                    </Button>
                                </>
                            )}
                            <Input id="verify-file" type="file" className="hidden" onChange={handleFileChange} />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {status === "verified" || status === "failed" ? (
                    <Button onClick={resetVerification} className="w-full">
                        Verify Another Document
                    </Button>
                ) : (
                    <Button onClick={handleVerify} disabled={!file || status === "verifying"} className="w-full">
                        {status === "verifying" ? "Verifying..." : "Verify Document"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
