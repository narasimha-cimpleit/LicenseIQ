import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { File } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-6">
            <File className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Licence IQ</h2>
          <p className="mt-2 text-muted-foreground">Research Platform</p>
        </div>
        
        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
              </div>
              <Button variant="link" className="p-0 h-auto text-sm">
                Forgot password?
              </Button>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full" 
              data-testid="button-signin"
            >
              Sign in
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Click "Sign in" to authenticate with your Replit account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
