import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Forbidden() {
  return (
    <Alert variant="destructive" className="max-w-xl">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Acceso restringido</AlertTitle>
      <AlertDescription>Tu rol no tiene permiso para ver esta sección.</AlertDescription>
    </Alert>
  );
}
