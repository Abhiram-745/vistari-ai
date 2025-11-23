import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export const AdminPasswordReset = () => {
  const [email, setEmail] = useState("dhrishiv.panjabi@gmail.com");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { email },
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${email}`);
      console.log("Reset response:", data);
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Admin Password Reset</CardTitle>
        </div>
        <CardDescription>
          Send a password reset email to any user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Password Reset Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};