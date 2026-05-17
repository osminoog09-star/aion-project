/**
 * Fetch EAS build metadata via Expo GraphQL (no local eas CLI).
 */
import { loadDotenvLocal } from "./load-dotenv-local.mjs";

loadDotenvLocal();

const BUILD_QUERY = `
query BuildById($buildId: ID!) {
  buildById(buildId: $buildId) {
    id
    status
    platform
    appVersion
    appBuildVersion
    runtimeVersion
    completedAt
    artifacts {
      applicationArchiveUrl
      buildUrl
    }
    gitCommitHash
  }
}
`;

export async function fetchExpoBuildById(buildId) {
  const token = process.env.EXPO_TOKEN?.trim();
  if (!token) {
    throw new Error("EXPO_TOKEN missing — set in .env.local or GitHub Secrets");
  }
  const res = await fetch("https://api.expo.dev/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: BUILD_QUERY,
      variables: { buildId },
    }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const build = json.data?.buildById;
  if (!build) throw new Error(`Build ${buildId} not found`);
  return build;
}
