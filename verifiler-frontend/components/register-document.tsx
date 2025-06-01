"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterDocument() {
    const [file, setFile] = useState<File | null>(null)
    const [documentName, setDocumentName] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [txHash, setTxHash] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !documentName) return

        setIsUploading(true)

        // Simulate blockchain transaction
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // In a real implementation, we would:
        // 1. Calculate the SHA-256 hash of the file
        // 2. Send a transaction to the blockchain with the hash
        // 3. Return the transaction hash

        setTxHash("0x" + Math.random().toString(16).slice(2, 42))
        setIsSuccess(true)
        setIsUploading(false)
    }

    const resetForm = () => {
        setFile(null)
        setDocumentName("")
        setIsSuccess(false)
        setTxHash("")
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
