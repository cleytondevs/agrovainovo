import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f9f4]">
      <Card className="w-full max-w-md mx-4 shadow-xl border-none">
        <CardContent className="pt-6 pb-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-destructive/10 p-4 rounded-full">
              <Sprout className="h-12 w-12 text-destructive rotate-180" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-secondary">404 Page Not Found</h1>
            <p className="text-muted-foreground">
              Looks like you've wandered off the field. The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <Link href="/">
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 cursor-pointer shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 duration-200">
              Return Home
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
