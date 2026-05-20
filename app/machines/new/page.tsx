import Link from "next/link";
import { MachineForm } from "@/components/MachineForm";
import { createMachine } from "@/lib/actions";

export default function NewMachinePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/machines"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Машини
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Нова машина</h1>
      </div>
      <MachineForm action={createMachine} submitLabel="Добави машина" />
    </div>
  );
}
