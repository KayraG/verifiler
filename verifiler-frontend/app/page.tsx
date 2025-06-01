import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VerifyDocument from "@/components/verify-document"
import RegisterDocument from "@/components/register-document"
import VerificationHistory from "@/components/verification-history"
import WalletConnection from "@/components/wallet-connection"
import WalletHeader from "@/components/wallet-header"

export default function Home() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">BlockVerify</h1>
                        <p className="text-sm text-muted-foreground">
                            Immutable document verification powered by Stellar blockchain
                        </p>
                    </div>
                    <WalletHeader />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto py-10 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Wallet Connection Card */}
                        <div className="lg:col-span-1">
                            <WalletConnection />
                        </div>

                        {/* Main App */}
                        <div className="lg:col-span-2">
                            <Tabs defaultValue="register" className="w-full">
                                <TabsList className="grid grid-cols-3 mb-8">
                                    <TabsTrigger value="register">Register Document</TabsTrigger>
                                    <TabsTrigger value="verify">Verify Document</TabsTrigger>
                                    <TabsTrigger value="history">Verification History</TabsTrigger>
                                </TabsList>
                                <TabsContent value="register">
                                    <RegisterDocument />
                                </TabsContent>
                                <TabsContent value="verify">
                                    <VerifyDocument />
                                </TabsContent>
                                <TabsContent value="history">
                                    <VerificationHistory />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
