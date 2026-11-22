import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { TENANTS } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", tenantId: TENANTS[0] ?? "", employeeId: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!EMAIL_RE.test(form.email.trim())) return setMsg({ type: "error", text: "Ingresa un correo válido." });
    if (form.password.length < 8) return setMsg({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
    if (!TENANTS.includes(form.tenantId)) return setMsg({ type: "error", text: "Selecciona una empresa válida." });

    setLoading(true);
    try {
      await register(form);
      setMsg({ type: "ok", text: "Cuenta creada. Ya puedes iniciar sesión." });
      toast.success("Cuenta creada correctamente");
      setForm((f) => ({ ...f, password: "", employeeId: "" }));
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Regístrate en el espacio de tu empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {msg && (
              <Alert variant={msg.type === "ok" ? "default" : "destructive"}>
                {msg.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{msg.text}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reg-email">Correo electrónico</Label>
              <Input id="reg-email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contraseña (mín. 8 caracteres)</Label>
              <Input id="reg-password" type="password" required minLength={8} autoComplete="new-password"
                value={form.password} onChange={set("password")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-tenant">Empresa</Label>
              <select id="reg-tenant" className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                value={form.tenantId} onChange={set("tenantId")}>
                {TENANTS.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-employee">ID de empleado (opcional)</Label>
              <Input id="reg-employee" placeholder="Te lo entrega RR. HH." value={form.employeeId} onChange={set("employeeId")} />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando…</>) : "Registrarme"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta? <Link to="/login" className="text-primary underline hover:text-primary/80">Inicia sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
