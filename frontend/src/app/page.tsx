import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Image
            src="/dime-logo.svg"
            alt="Dime Logo"
            width={150}
            height={75}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl">
            How are you joining us today?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/login/brand-ambassador">
              <Card className="cursor-pointer transition-all duration-150 rounded-xl border-2 border-gray-300 bg-background hover:bg-gray-50 transform-gpu active:translate-y-1 border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-gray-300">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold mb-2">
                    I'm a Brand Ambassador
                  </h3>
                  <p className="text-muted-foreground">
                    I create content and partner with brands.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/login/client">
              <Card className="cursor-pointer transition-all duration-150 rounded-xl border-2 border-gray-300 bg-background hover:bg-gray-50 transform-gpu active:translate-y-1 border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-gray-300">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🏢</div>
                  <h3 className="text-xl font-semibold mb-2">I'm a Client</h3>
                  <p className="text-muted-foreground">
                    I'm looking for talent for my brand.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
