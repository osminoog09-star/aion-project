import { UpdateBanner } from "./UpdateBanner";
import { UpdateOverlay } from "./UpdateOverlay";
import { PostUpdateCinematicHost } from "./PostUpdateCinematicHost";
import { useUpdates } from "../../hooks/useUpdates";

/**
 * OTA через Expo Updates: проверка при старте, из background и по таймеру; UI и автозагрузка.
 */
export function UpdateGate() {
  const {
    phase,
    visible,
    bannerVisible,
    discreteBannerUx,
    progress,
    errorMessage,
    manifestSummary,
    snooze,
    startDownload,
    applyReload,
    retryAfterError,
    expandUpdateOverlay,
  } = useUpdates();

  const showBanner =
    bannerVisible &&
    (discreteBannerUx
      ? phase === "prompt" || phase === "downloading" || phase === "ready"
      : phase === "prompt");

  return (
    <>
      <PostUpdateCinematicHost />
      <UpdateBanner
        visible={showBanner}
        phase={phase}
        progress={progress}
        manifestSummary={manifestSummary}
        onDownload={() => {
          void startDownload();
        }}
        onApplyReload={() => {
          void applyReload();
        }}
        onLater={() => {
          void snooze();
        }}
        onOpenDetails={expandUpdateOverlay}
      />
      <UpdateOverlay
        visible={visible}
        phase={phase}
        progress={progress}
        errorMessage={errorMessage}
        manifestSummary={manifestSummary}
        onSnooze={() => {
          void snooze();
        }}
        onDownloadNow={() => {
          void startDownload();
        }}
        onApplyReload={() => {
          void applyReload();
        }}
        onRetry={() => {
          void retryAfterError();
        }}
      />
    </>
  );
}
