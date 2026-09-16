// Ported from MboaTrustFrontend/src/api/pagination.ts — the shared
// `{page,limit}` → `{page,limit,total}` contract every backend list
// endpoint speaks.
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

export function getNextPageParam(lastPage: { meta: PageMeta }): number | undefined {
  const { page, limit, total } = lastPage.meta;
  return page * limit < total ? page + 1 : undefined;
}
