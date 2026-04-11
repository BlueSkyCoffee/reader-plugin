import { useQuery } from "@tanstack/react-query"
import { ParserProvider } from "@/features/lightnovel/services"
import { requestMessage } from "@/shared/infra/messaging"

export function useNovelFetcher(url: string) {
  return useQuery({
    queryKey: ["novel-info", url],
    queryFn: async () => {
      const metadata = await requestMessage("fetchNovelMetadata", { url })

      const catalog = await requestMessage("fetchNovelCatalog", {
        source: metadata.source,
        id: metadata.id,
        catalogUrl: metadata.catalogUrl,
      })

      return {
        ...metadata,
        volumes: catalog,
      }
    },
    enabled: !!url && ParserProvider.getSource(url) !== null,
    staleTime: 1000 * 60 * 30,
  })
}
