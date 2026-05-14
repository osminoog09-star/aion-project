import type { Metadata } from "next";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { EcosystemModuleStub, ecosystemModuleMetadata } from "@/components/ecosystem/EcosystemModuleStub";

const DESC = "AION Studio — творческий/конфигурационный модуль экосистемы на www.aion.com/studio; в разработке.";

export const metadata: Metadata = ecosystemModuleMetadata({
  title: "Studio",
  description: DESC,
  path: ecosystemRoutes.studio,
});

export default function StudioPage() {
  return (
    <EcosystemModuleStub
      title="Studio"
      description={DESC}
      path={ecosystemRoutes.studio}
      body="Зарезервировано под сценарии конфигурации, контент и будущие веб-инструменты бренда без привязки к одному приложению."
    />
  );
}
