export type ContentApprovalSort = "newest" | "oldest" | "title";

export interface ContentApprovalViewState {
  tab: string;
  query: string;
  sort: ContentApprovalSort;
  anchor?: string | number;
}

const STORAGE_KEY = "content_approval_view_state_v1";

export function saveApprovalViewState(state: ContentApprovalViewState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures in private/incognito contexts.
  }
}

export function loadApprovalViewState(): ContentApprovalViewState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContentApprovalViewState;
  } catch {
    return null;
  }
}

export function serializeApprovalStateToQuery(state: ContentApprovalViewState): string {
  const params = new URLSearchParams();
  if (state.tab) params.set("tab", state.tab);
  if (state.query) params.set("q", state.query);
  if (state.sort) params.set("sort", state.sort);
  if (state.anchor !== undefined && state.anchor !== null) params.set("anchor", String(state.anchor));
  return params.toString();
}
