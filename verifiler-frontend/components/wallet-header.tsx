"use client"

import { useEffect, useState } from "react"
import freighterApi from "@stellar/freighter-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"
import { connectWallet } from "@/lib/blockchain";

export default function WalletHeader() {
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)

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
        } catch (error) {
            console.error("Error connecting to Freighter:", error)
        } finally {
            setIsConnecting(false)
        }
    }

    // Format address for display
    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    if (publicKey) {
        return (
            <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                    <Wallet className="mr-1 h-3 w-3" />
                    Connected
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">{formatAddress(publicKey)}</span>
            </div>
        )
    }

    return (
        <Button variant="outline" onClick={handleConnectWallet} disabled={isConnecting} size="sm">
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
    )
}
