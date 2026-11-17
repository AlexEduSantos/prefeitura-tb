export interface PaginationInput {
  page?: string | number;
  limit?: string | number;
  skip?: string | number;
  take?: string | number;
}

export function resolvePagination(
  query: PaginationInput = {},
  defaultTake = 50,
  maxTake = 100,
): { skip: number; take: number } {
  const rawTake = query.take ?? query.limit;
  const parsedTake = Number(rawTake);
  const take =
    Number.isFinite(parsedTake) && parsedTake > 0
      ? Math.min(maxTake, Math.floor(parsedTake))
      : defaultTake;

  if (query.skip !== undefined && query.skip !== '') {
    const parsedSkip = Number(query.skip);
    const skip =
      Number.isFinite(parsedSkip) && parsedSkip >= 0
        ? Math.floor(parsedSkip)
        : 0;
    return { skip, take };
  }

  const parsedPage = Number(query.page);
  const page =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;

  return { skip: (page - 1) * take, take };
}
