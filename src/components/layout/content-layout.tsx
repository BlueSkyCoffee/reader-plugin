import { PageErrorBoundary } from "@/components/app/error-boundary"
import { ReaderContainer } from "@/entrypoints/content/components/reader-container"

export function ContentLayout() {
  return (
    <PageErrorBoundary>
      <ReaderContainer />
    </PageErrorBoundary>
  )
}
