"use client"

import { useEffect, useState } from "react"
import freighterApi from "@stellar/freighter-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Copy, ExternalLink } from "lucide-react"

export default function WalletConnection() {
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [copied, setCopied] = useState(false)

    // Check if wallet is connected on page load
    useEffect(() => {
        const checkFreighter = async () => {
            try {
                const connected = await freighterApi.isConnected()
                if (connected) {
                    const { address } = await freighterApi.getAddress()
                    setPublicKey(address)
                }
            } catch (error) {
                console.error("Error checking Freighter connection:", error)
            }
        }

        checkFreighter()
    }, [])

    // Connect wallet button handler
    const handleConnectWallet = async () => {
        setIsConnecting(true)
        try {
            await freighterApi.setAllowed()
            const { address } = await freighterApi.getAddress()
            setPublicKey(address)
            location.reload()
        } catch (error) {
            console.error("Error connecting to Freighter:", error)
        } finally {
            setIsConnecting(false)
        }
    }

    // Copy address to clipboard
    const copyToClipboard = async () => {
        if (publicKey) {
            await navigator.clipboard.writeText(publicKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Open explorer link
    const openExplorer = () => {
        if (publicKey) {
            window.open(`https://stellar.expert/explorer/public/account/${publicKey}`, "_blank", "noopener,noreferrer")
        }
    }

    // Format address for display
    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    if (publicKey) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Wallet className="mr-2 h-5 w-5" />
                        Wallet Connected
                    </CardTitle>
                    <CardDescription>Your Stellar wallet is connected to BlockVerify</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                Connected
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <div>
                                <p className="text-sm font-medium">Address</p>
                                <p className="text-sm text-muted-foreground font-mono">{formatAddress(publicKey)}</p>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                                    <Copy className="h-4 w-4" />
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={openExplorer}>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Full address: <span className="font-mono break-all">{publicKey}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                </CardTitle>
                <CardDescription>Connect your Freighter wallet to register and verify documents on Stellar</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleConnectWallet} disabled={isConnecting} className="w-full">
                    {isConnecting ? "Connecting..." : "Connect Freighter Wallet"}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                    Don't have Freighter?{" "}
                    <a
                        href="https://freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Download here
                    </a>
                </p>
            </CardContent>
        </Card>
    )
}
