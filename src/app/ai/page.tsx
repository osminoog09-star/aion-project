import type { Metadata } from "next";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { EcosystemModuleStub, ecosystemModuleMetadata } from "@/components/ecosystem/EcosystemModuleStub";

const DESC = "AI-слой экосистемы AION на www.aion.com/ai — планируемый модуль портала.";

export const metadata: Metadata = ecosystemModuleMetadata({
  title: "AI",
  description: DESC,
  path: ecosystemRoutes.ai,
});

export default function AiPage() {
  return (
    <EcosystemModuleStub
      title="AI"
      description={DESC}
      path={ecosystemRoutes.ai}
      body="Публичные материалы и инструменты бренда AION (модели, политики, интеграции) будут жить здесь отдельно от прикладного Driver."
    />
  );
}
