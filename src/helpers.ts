/** Hand-maintained ergonomic helpers for the generated whoisfreaks SDK. */
export interface RetryOpts { retries?: number; backoffMs?: number; retryOn?: number[]; }

export async function withRetries<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
  const { retries = 3, backoffMs = 500, retryOn = [429, 500, 502, 503, 504] } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (err: any) {
      lastErr = err;
      const status = err?.response?.status ?? err?.status;
      if (retryOn.indexOf(status) !== -1 && attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * 2 ** attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export async function* paginate<TResp, TItem>(
  fetchPage: (page: number) => Promise<TResp>,
  pick: (r: TResp) => { items: TItem[]; totalPages: number; },
): AsyncGenerator<TItem> {
  let page = 1;
  for (;;) {
    const { items, totalPages } = pick(await fetchPage(page));
    for (const it of items ?? []) yield it;
    if (page >= (totalPages || page)) return;
    page++;
  }
}
