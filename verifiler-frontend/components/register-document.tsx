"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateFileHash, registerDocumentOnBlockchain } from "@/lib/blockchain"
import freighterApi from "@stellar/freighter-api"

export default function RegisterDocument() {
    const [file, setFile] = useState<File | null>(null)
    const [documentName, setDocumentName] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [txHash, setTxHash] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !documentName) return

        try {
            setIsUploading(true)
            setError(null)

            // Check if wallet is connected
            const isConnected = await freighterApi.isConnected()
            if (!isConnected) {
                throw new Error("Wallet not connected. Please connect your Freighter wallet.")
            }

            // Get public key
            const { address: publicKey } = await freighterApi.getAddress()
            if (!publicKey) {
                throw new Error("Could not get wallet address. Please reconnect your wallet.")
            }

            // Calculate document hash
            const documentHash = await calculateFileHash(file)

            // Register document on blockchain
            const hash = await registerDocumentOnBlockchain(publicKey, documentHash, documentName)

            // Update UI with success
            setTxHash(hash)
            setIsSuccess(true)
        } catch (err) {
            console.error("Error registering document:", err)
            setError(err instanceof Error ? err.message : "Failed to register document. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setFile(null)
        setDocumentName("")
        setIsSuccess(false)
        setTxHash("")
        setError(null)
    }

    if (isSuccess) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileCheck className="mr-2 h-6 w-6 text-green-500" />
                        Document Registered Successfully
                    </CardTitle>
                    <CardDescription>Your document has been permanently registered on the blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Document Name</Label>
                            <p className="text-sm font-medium">{documentName}</p>
                        </div>
                        <div>
                            <Label>File</Label>
                            <p className="text-sm font-medium">{file?.name}</p>
                        </div>
                        <div>
                            <Label>Transaction Hash</Label>
                            <p className="text-sm font-medium break-all">{txHash}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={resetForm} className="w-full">
                        Register Another Document
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Register New Document</CardTitle>
                <CardDescription>Upload a document to register its hash on the blockchain</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
                    <div className="space-y-2">
                        <Label htmlFor="documentName">Document Name</Label>
                        <Input
                            id="documentName"
                            placeholder="Enter a name for this document"
                            value={documentName}
                            onChange={(e) => setDocumentName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file">Upload Document</Label>
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
                                    <p className="text-xs text-muted-foreground mb-3">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                                    <Button variant="outline" onClick={() => document.getElementById("file")?.click()}>
                                        Select File
                                    </Button>
                                </>
                            )}
                            <Input id="file" type="file" className="hidden" onChange={handleFileChange} required />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={!file || !documentName || isUploading}>
                        {isUploading ? "Registering..." : "Register Document"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
