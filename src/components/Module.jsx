import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/services/apiClient";

export function Module({ title, children }) {
  return <div className="space-y-6"><h1 className="pr-12 text-2xl font-semibold tracking-tight">{title}</h1>{children}</div>;
}

export function Panel({ title, children }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent className="space-y-4">{children}</CardContent></Card>;
}

export function Field({ label, options, name, ...props }) {
  const id = useId();
  return <div className="grid gap-2">
    <label className="text-sm font-medium" htmlFor={id}>{label}</label>
    {options ? <select id={id} name={name} className="h-9 rounded-md border bg-background px-2 text-sm" {...props}>
      {options.map((option) => typeof option === "string"
        ? <option key={option}>{option}</option>
        : <option key={option.value} value={option.value}>{option.label}</option>)}
    </select> : <Input id={id} name={name} {...props} />}
  </div>;
}

export function Action({ label, onSubmit, children, disabled }) {
  const pending = useRef(false);
  const [state, setState] = useState({});
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    pending.current = true;
    setState({ busy: true });
    try {
      const message = await onSubmit(values);
      setState({ message: message || "Operación completada." });
    } catch (error) {
      const missing = error.details?.missing?.map((item) => item.name || item.key).join(", ");
      setState({ error: [getErrorMessage(error), missing].filter(Boolean).join(" ") });
    } finally {
      pending.current = false;
    }
  }
  return <form className="space-y-3" onSubmit={submit}>
    <fieldset disabled={disabled || state.busy} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</fieldset>
    <Button type="submit" disabled={disabled || state.busy}>{state.busy ? "Procesando…" : label}</Button>
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.message && <p role="status" className="text-sm">{state.message}</p>}
  </form>;
}

export function Resource({ state, children }) {
  if (state.loading) return <p role="status" className="text-muted-foreground">Cargando…</p>;
  if (state.error) return <div className="space-y-2">
    <p role="alert" className="text-destructive">{state.error}</p>
    <Button variant="outline" onClick={state.reload}>Reintentar</Button>
  </div>;
  return state.data == null ? null : children(state.data);
}

export function Rows({ rows, columns, id }) {
  if (!rows?.length) return <p className="text-sm text-muted-foreground">Sin registros.</p>;
  return <Table><TableHeader><TableRow>{columns.map(([label]) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{rows.map((row, index) => <TableRow key={row[id] ?? index}>
      {columns.map(([label, value]) => <TableCell key={label}>{(typeof value === "function" ? value(row) : row[value]) ?? "—"}</TableCell>)}
    </TableRow>)}</TableBody></Table>;
}

export function Pages({ data, page, change }) {
  if (page <= 1 && !data?.pagination && !data?.nextToken) return null;
  const more = data.pagination ? page < data.pagination.totalPages : Boolean(data.nextToken);
  return <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline" disabled={page <= 1} onClick={() => change(page - 1)}>Anterior</Button>
    <span className="text-sm">Página {page}</span>
    <Button variant="outline" disabled={!more} onClick={() => change(page + 1, data.nextToken)}>Siguiente</Button>
  </div>;
}

export function FileLink({ url, children }) {
  if (!url || !/^https:\/\//i.test(url)) return null;
  return <a className="text-primary underline" href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
}
