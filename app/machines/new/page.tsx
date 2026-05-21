import Link from "next/link";
import { MachineForm } from "@/components/MachineForm";
import { createMachine } from "@/lib/actions";

export default function NewMachinePage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/machines"
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← Машини
        </Link>
        <h2 className="mt-1 text-base font-extrabold text-text">Нова машина</h2>
      </div>
      <MachineForm action={createMachine} submitLabel="Добави машина" />
    </div>
  );
}
