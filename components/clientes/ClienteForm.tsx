"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENTE_TIPOS } from "@/lib/constants";
import type { Cliente } from "@/types";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  cidade: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cliente?: Cliente | null;
  onSaved: (created?: Cliente) => void;
}

export function ClienteForm({ open, onOpenChange, cliente, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: cliente?.nome || "",
      whatsapp: cliente?.whatsapp || "",
      tipo: cliente?.tipo || "",
      cidade: cliente?.cidade || "",
      observacoes: cliente?.observacoes || "",
    },
  });

  // Reaplica valores ao abrir para edição.
  const tipo = watch("tipo");

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const isEdit = Boolean(cliente?.rowNumber && cliente.rowNumber > 0);
      const res = await fetch("/api/clientes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { ...cliente, ...values } : values
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      toast.success(isEdit ? "Cliente atualizado" : "Cliente cadastrado");
      reset();
      onOpenChange(false);
      onSaved(isEdit ? undefined : (json.data as Cliente));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} placeholder="Nome do cliente" />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input id="whatsapp" {...register("whatsapp")} placeholder="(00) 00000-0000" />
            {errors.whatsapp && (
              <p className="text-xs text-destructive mt-1">{errors.whatsapp.message}</p>
            )}
          </div>
          <div>
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setValue("tipo", v ?? "", { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {CLIENTE_TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo.message}</p>}
          </div>
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" {...register("cidade")} placeholder="Cidade" />
          </div>
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
