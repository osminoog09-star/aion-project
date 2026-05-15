import type { Metadata } from "next";
import { OwnerCommandCenter } from "@/components/operations/OwnerCommandCenter";
import { OperationsSubNav } from "@/components/operations/ExecutionAuditPanels";
import { buildOwnerCommandCenterView } from "@/lib/operations/owner-command-center";

export const metadata: Metadata = {
  title: "Центр управления AI — AION Operations",
  description:
    "Командный центр владельца: готовность проекта, roadmap блоками, очередь AI, здоровье production.",
};

export default function OwnerCommandCenterPage() {
  const view = buildOwnerCommandCenterView();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
      <OperationsSubNav />
      <OwnerCommandCenter view={view} />
    </div>
  );
}
