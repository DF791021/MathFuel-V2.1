import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, LockKeyhole, ShieldCheck, Rocket } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-0 shadow-xl shadow-indigo-100/50 bg-white/90">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200"><Rocket className="w-7 h-7 text-white" /></div>
          <CardTitle className="text-2xl font-extrabold text-indigo-950">MathFuel accounts are invitation-only</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">A Super Admin creates your account and assigns your email address as your username. You create your own password from the secure invitation link sent to that email.</p>
          <div className="grid gap-3 sm:grid-cols-3 text-center text-sm">
            <div className="rounded-xl bg-indigo-50 p-4"><ShieldCheck className="mx-auto mb-2 h-5 w-5 text-indigo-600" /><span>Admin-approved access</span></div>
            <div className="rounded-xl bg-amber-50 p-4"><Mail className="mx-auto mb-2 h-5 w-5 text-amber-600" /><span>Email is your username</span></div>
            <div className="rounded-xl bg-emerald-50 p-4"><LockKeyhole className="mx-auto mb-2 h-5 w-5 text-emerald-600" /><span>You choose your password</span></div>
          </div>
          <p className="text-center text-sm text-muted-foreground">Already received an invitation? Open the link in your email to create your password.</p>
          <Link href="/login"><Button className="w-full">Go to login</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
