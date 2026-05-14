import type { Metadata } from "next";
import { ecosystemRoutes } from "@/lib/ecosystem-routes";
import { EcosystemModuleStub, ecosystemModuleMetadata } from "@/components/ecosystem/EcosystemModuleStub";

const DESC =
  "AION Link — связка устройств и очередей на www.aion.com/link; портальный слой дополняет клиент Driver.";

export const metadata: Metadata = ecosystemModuleMetadata({
  title: "Link",
  description: DESC,
  path: ecosystemRoutes.link,
});

export default function LinkPage() {
  return (
    <EcosystemModuleStub
      title="Link"
      description={DESC}
      path={ecosystemRoutes.link}
      body="Документация и статус облачного pairing для Link будут публиковаться здесь; исполнение по-прежнему в мобильном/десктопном клиенте."
    />
  );
}
