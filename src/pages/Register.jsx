import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", tenantId: "tenant_a" });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await register(form.email, form.password, form.tenantId);
      setMsg({ type: "ok", text: "Cuenta creada. Ya puedes iniciar sesión." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
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
              <Label>Correo electrónico</Label>
              <Input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña (mín. 8 caracteres)</Label>
              <Input type="password" required minLength={8} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tenant (empresa)</Label>
              <select className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
                <option value="tenant_a">tenant_a</option>
                <option value="tenant_b">tenant_b</option>
                <option value="tenant_c">tenant_c</option>
              </select>
            </div>
            <Button className="w-full">Registrarme</Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta? <Link to="/login" className="text-primary underline hover:text-primary/80">Inicia sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}