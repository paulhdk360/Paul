import { PageLoading } from "@/components/PageLoading";

// Scoped to the affaire's own layout (header + AffaireTabs), which stays
// mounted and instantly visible across tab clicks — only this fallback
// covers the tab content area while the destination page's data loads.
export default function Loading() {
  return <PageLoading />;
}
