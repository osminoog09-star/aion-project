import type { Metadata } from "next";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { EcosystemModuleStub, ecosystemModuleMetadata } from "@/components/ecosystem/EcosystemModuleStub";

const DESC = "AION Core — общие примитивы экосистемы на www.aion.com/core; маршрут зарезервирован.";

export const metadata: Metadata = ecosystemModuleMetadata({
  title: "Core",
  description: DESC,
  path: ecosystemRoutes.core,
});

export default function CorePage() {
  return (
    <EcosystemModuleStub
      title="Core"
      description={DESC}
      path={ecosystemRoutes.core}
      body="Сюда ляжет описание и доступ к общим сервисам (идентичность, телеметрия портала, SDK) по мере выделения из монолита Driver."
    />
  );
}
