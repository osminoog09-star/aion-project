import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { ReactNode } from "react";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider } from "../../features/auth/context/AuthContext";
import { queryClient } from "../../lib/queryClient";

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "AION_TANSTACK_CACHE_V1",
  throttleTime: 2000,
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const k = query.queryKey[0];
            return typeof k === "string" && k.startsWith("cloud:");
          },
        },
      }}
    >
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
