import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Image
            src="/dime-logo.svg"
            alt="Dime Logo"
            width={150}
            height={75}
            className="mx-auto mb-4"
          />
          <CardTitle>Client Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              className="w-full"
            />
          </div>
          <Button variant="secondary" className="w-full">
            Login
          </Button>
          <div className="text-center">
            <Link href="/signin" className="text-sm text-primary hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}