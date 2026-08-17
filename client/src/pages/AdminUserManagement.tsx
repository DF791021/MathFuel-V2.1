import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, MailPlus, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminUserManagement() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const usersQuery = trpc.adminUsers.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const createMutation = trpc.adminUsers.create.useMutation({ onSuccess: () => { toast.success("Account created and invitation sent."); setName(""); setEmail(""); setGrade(""); usersQuery.refetch(); }, onError: (error) => toast.error(error.message) });
  const resendMutation = trpc.adminUsers.resendInvite.useMutation({ onSuccess: (data) => toast.success(data.invitationSent ? "Invitation resent." : "Account saved, but email delivery needs attention."), onError: (error) => toast.error(error.message) });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"student" | "parent" | "teacher">("student");
  const [grade, setGrade] = useState("");

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen flex items-center justify-center p-6 text-center">Super Admin access required.</div>;

  function createAccount(event: React.FormEvent) {
    event.preventDefault();
    createMutation.mutate({ email, name, userType, gradeLevel: grade ? Number(grade) : undefined });
  }

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex items-center justify-between gap-4"><div><Button variant="ghost" onClick={() => navigate("/admin/editor")} className="mb-2 -ml-3"><ArrowLeft className="mr-2 h-4 w-4" />Admin portal</Button><h1 className="text-3xl font-bold text-slate-900">User access</h1><p className="text-muted-foreground">Create approved accounts. The assigned email is the username; users create their own password.</p></div><ShieldCheck className="hidden sm:block h-10 w-10 text-indigo-600" /></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><MailPlus className="h-5 w-5 text-indigo-600" />Create an account</CardTitle></CardHeader><CardContent><form onSubmit={createAccount} className="grid gap-4 md:grid-cols-5 items-end"><div className="space-y-2 md:col-span-1"><Label htmlFor="user-name">Name</Label><Input id="user-name" value={name} onChange={e => setName(e.target.value)} required /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="user-email">Email / username</Label><Input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label>Account type</Label><Select value={userType} onValueChange={value => setUserType(value as typeof userType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="parent">Parent</SelectItem><SelectItem value="teacher">Teacher</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="user-grade">Grade (optional)</Label><Input id="user-grade" type="number" min="1" max="12" value={grade} onChange={e => setGrade(e.target.value)} /><Button type="submit" className="mt-2 w-full" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create & invite"}</Button></div></form></CardContent></Card>
    <Card><CardHeader><CardTitle>Accounts</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email / username</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{usersQuery.data?.map(account => <TableRow key={account.id}><TableCell>{account.name || "—"}</TableCell><TableCell>{account.email || "—"}</TableCell><TableCell className="capitalize">{account.userType}</TableCell><TableCell>{account.passwordSet ? <span className="text-emerald-600">Active</span> : <span className="text-amber-600">Invitation pending</span>}</TableCell><TableCell className="text-right">{!account.passwordSet && <Button variant="outline" size="sm" onClick={() => resendMutation.mutate({ userId: account.id })} disabled={resendMutation.isPending}><RefreshCw className="mr-2 h-3.5 w-3.5" />Resend</Button>}</TableCell></TableRow>)}</TableBody></Table>{usersQuery.isLoading && <p className="py-6 text-center text-muted-foreground">Loading accounts…</p>}{!usersQuery.isLoading && !usersQuery.data?.length && <p className="py-6 text-center text-muted-foreground">No accounts yet.</p>}</CardContent></Card>
  </div></div>;
}
