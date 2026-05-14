import type { Metadata } from "next";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { EcosystemModuleStub, ecosystemModuleMetadata } from "@/components/ecosystem/EcosystemModuleStub";

const DESC =
  "Раздел загрузок экосистемы AION на www.aion.com/downloads — в подготовке; маршрут зарезервирован под мультипродуктовую платформу.";

export const metadata: Metadata = ecosystemModuleMetadata({
  title: "Downloads",
  description: DESC,
  path: ecosystemRoutes.downloads,
});

export default function DownloadsPage() {
  return (
    <EcosystemModuleStub
      title="Downloads"
      description={DESC}
      path={ecosystemRoutes.downloads}
      body="Здесь появятся официальные ссылки на APK/AAB, десктоп-бандлы и вспомогательные пакеты. Сейчас установка Driver идёт через ваши EAS-каналы и политику релизов."
    />
  );
}
