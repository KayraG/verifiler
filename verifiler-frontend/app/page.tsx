import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VerifyDocument from "@/components/verify-document"
import RegisterDocument from "@/components/register-document"
import VerificationHistory from "@/components/verification-history"

export default function Home() {
  return (
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold text-center mb-2">Verifiler</h1>
        <p className="text-center text-muted-foreground mb-10">Immutable document verification powered by blockchain</p>

        <div className="max-w-3xl mx-auto">
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
  )
}
