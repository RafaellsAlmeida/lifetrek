import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPublicPagePath } from "@/lib/analyticsPath";

export type MonthlyReportKey = "2026-01" | "2026-02" | "2026-03";

export const MONTHLY_REPORT_OPTIONS: Array<{ key: MonthlyReportKey; label: string }> = [
  { key: "2026-01", label: "Janeiro 2026" },
  { key: "2026-02", label: "Fevereiro 2026" },
  { key: "2026-03", label: "Março 2026" },
];

export type TopicCategory =
  | "Quality & Compliance"
  | "Personalized Solutions"
  | "Manufacturing & Validation"
  | "Supply Chain & Scale"
  | "Corporate & Talent";

export type ICPGroup =
  | "Quality / Regulatory Leaders"
  | "R&D / Engineering Teams"
  | "Supply Chain / Operations Leaders"
  | "Executive Decision Makers"
  | "Talent / Broad Audience";

export interface MonthlyPostItem {
  id: string;
  date: string;
  title: string;
  category: TopicCategory;
  icp: ICPGroup;
  slidesCount: number;
  slidesBucket: "0" | "1" | "2-4" | "5+";
  impressions: number;
  clicks: number;
  ctrPct: number;
  reactions: number;
  comments: number;
  reposts: number;
  engagementRatePct: number;
}

export interface CategorySummary {
  category: TopicCategory;
  posts: number;
  impressions: number;
  reactions: number;
  weightedCtrPct: number;
  avgEngagementRatePct: number;
}

export interface ICPSummary {
  icp: ICPGroup;
  posts: number;
  impressions: number;
  weightedCtrPct: number;
  avgEngagementRatePct: number;
}

export interface FollowerIndustryRow {
  label: string;
  followers: number;
  percentage: number;
}

export interface PublicPageRow {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  avgTimeOnPageSeconds: number;
  bounceRate: number;
}

export interface MonthlyMarketingReportData {
  month: MonthlyReportKey;
  linkedin: {
    summary: {
      posts: number;
      impressions: number;
      clicks: number;
      weightedCtrPct: number;
      totalInteractions: number;
      avgEngagementRatePct: number;
    };
    posts: MonthlyPostItem[];
    categories: CategorySummary[];
    icps: ICPSummary[];
  };
  followers: {
    snapshotDate: string | null;
    industries: FollowerIndustryRow[];
    jobFunctions: FollowerIndustryRow[];
  };
  ga4: {
    publicPageViews: number;
    publicPagesTracked: number;
    avgTimeOnPageSeconds: number;
    avgBounceRate: number;
    topPublicPages: PublicPageRow[];
    dailyPublicViews: Array<{ date: string; pageViews: number }>;
  };
}

const FALLBACK_FOLLOWER_INDUSTRIES: FollowerIndustryRow[] = [
  { label: "Medical Equipment Manufacturing", followers: 39, percentage: 26.7 },
  { label: "Hospitals and Health Care", followers: 12, percentage: 8.2 },
  { label: "Machinery Manufacturing", followers: 9, percentage: 6.2 },
  { label: "Motor Vehicle Manufacturing", followers: 5, percentage: 3.4 },
  { label: "Industrial Machinery Manufacturing", followers: 5, percentage: 3.4 },
  { label: "Software Development", followers: 4, percentage: 2.7 },
  { label: "Appliances, Electrical, and Electronics Manufacturing", followers: 4, percentage: 2.7 },
  { label: "Transportation, Logistics, Supply Chain and Storage", followers: 4, percentage: 2.7 },
  { label: "Business Consulting and Services", followers: 3, percentage: 2.1 },
  { label: "Pharmaceutical Manufacturing", followers: 3, percentage: 2.1 },
];

const FALLBACK_FOLLOWER_JOB_FUNCTIONS: FollowerIndustryRow[] = [
  { label: "Engineering", followers: 21, percentage: 14.4 },
  { label: "Operations", followers: 20, percentage: 13.7 },
  { label: "Business Development", followers: 15, percentage: 10.3 },
  { label: "Arts and Design", followers: 11, percentage: 7.5 },
  { label: "Sales", followers: 11, percentage: 7.5 },
  { label: "Information Technology", followers: 7, percentage: 4.8 },
  { label: "Research", followers: 6, percentage: 4.1 },
  { label: "Media and Communication", followers: 4, percentage: 2.7 },
  { label: "Consulting", followers: 3, percentage: 2.1 },
  { label: "Finance", followers: 3, percentage: 2.1 },
];

const FALLBACK_FOLLOWER_SNAPSHOT_DATE = "2026-02-27";

type SeededPost = Omit<
  MonthlyPostItem,
  "id" | "category" | "icp" | "slidesBucket"
>;

const SEEDED_POSTS: Record<MonthlyReportKey, SeededPost[]> = {
  "2026-01": [
    {
      date: "2026-01-09",
      title: "Lançamento do site",
      slidesCount: 1,
      impressions: 833,
      clicks: 66,
      ctrPct: 7.92,
      reactions: 13,
      comments: 2,
      reposts: 1,
      engagementRatePct: 9.84,
    },
    {
      date: "2026-01-09",
      title: "Vaga operador de usinagem",
      slidesCount: 0,
      impressions: 569,
      clicks: 37,
      ctrPct: 6.5,
      reactions: 9,
      comments: 0,
      reposts: 3,
      engagementRatePct: 8.61,
    },
    {
      date: "2026-01-21",
      title: "DFM CAD aceita tudo, a máquina não",
      slidesCount: 1,
      impressions: 281,
      clicks: 8,
      ctrPct: 2.85,
      reactions: 6,
      comments: 0,
      reposts: 0,
      engagementRatePct: 4.98,
    },
    {
      date: "2026-01-22",
      title: "P&D e medicina personalizada",
      slidesCount: 5,
      impressions: 225,
      clicks: 59,
      ctrPct: 26.22,
      reactions: 9,
      comments: 0,
      reposts: 0,
      engagementRatePct: 30.22,
    },
    {
      date: "2026-01-23",
      title: "5 riscos supply chain 2026",
      slidesCount: 1,
      impressions: 188,
      clicks: 18,
      ctrPct: 9.57,
      reactions: 6,
      comments: 1,
      reposts: 0,
      engagementRatePct: 13.3,
    },
    {
      date: "2026-01-27",
      title: "A física por trás da validação 3D + CNC",
      slidesCount: 1,
      impressions: 346,
      clicks: 11,
      ctrPct: 3.18,
      reactions: 10,
      comments: 0,
      reposts: 0,
      engagementRatePct: 6.07,
    },
    {
      date: "2026-01-28",
      title: "Protótipo para produção em escala",
      slidesCount: 1,
      impressions: 300,
      clicks: 6,
      ctrPct: 2.0,
      reactions: 7,
      comments: 0,
      reposts: 0,
      engagementRatePct: 4.33,
    },
  ],
  "2026-02": [
    {
      date: "2026-02-27",
      title: "Importado vs produção local: custo real",
      slidesCount: 1,
      impressions: 15,
      clicks: 5,
      ctrPct: 33.33,
      reactions: 2,
      comments: 0,
      reposts: 0,
      engagementRatePct: 46.67,
    },
    {
      date: "2026-02-05",
      title: "Sala limpa e controle de contaminação",
      slidesCount: 7,
      impressions: 310,
      clicks: 80,
      ctrPct: 25.81,
      reactions: 9,
      comments: 1,
      reposts: 1,
      engagementRatePct: 29.35,
    },
    {
      date: "2026-02-11",
      title: "Pureza ISO7 vs ISO8",
      slidesCount: 1,
      impressions: 184,
      clicks: 7,
      ctrPct: 3.8,
      reactions: 8,
      comments: 0,
      reposts: 0,
      engagementRatePct: 8.15,
    },
    {
      date: "2026-02-11",
      title: "Sustentabilidade no P&L",
      slidesCount: 1,
      impressions: 89,
      clicks: 3,
      ctrPct: 3.37,
      reactions: 5,
      comments: 0,
      reposts: 0,
      engagementRatePct: 8.99,
    },
    {
      date: "2026-02-16",
      title: "Metrologia ZEISS CMM",
      slidesCount: 1,
      impressions: 537,
      clicks: 7,
      ctrPct: 1.3,
      reactions: 17,
      comments: 0,
      reposts: 2,
      engagementRatePct: 4.84,
    },
    {
      date: "2026-02-19",
      title: "Medicina personalizada em casos complexos",
      slidesCount: 1,
      impressions: 134,
      clicks: 9,
      ctrPct: 6.72,
      reactions: 4,
      comments: 0,
      reposts: 1,
      engagementRatePct: 10.45,
    },
    {
      date: "2026-02-24",
      title: "ANVISA FDA ISO13485 compliance",
      slidesCount: 1,
      impressions: 77,
      clicks: 5,
      ctrPct: 6.49,
      reactions: 3,
      comments: 0,
      reposts: 0,
      engagementRatePct: 10.39,
    },
    {
      date: "2026-02-25",
      title: "Precisão em larga escala",
      slidesCount: 3,
      impressions: 61,
      clicks: 5,
      ctrPct: 8.2,
      reactions: 2,
      comments: 0,
      reposts: 0,
      engagementRatePct: 11.48,
    },
    {
      date: "2026-02-26",
      title: "Qualidade é o produto",
      slidesCount: 4,
      impressions: 52,
      clicks: 2,
      ctrPct: 3.85,
      reactions: 4,
      comments: 0,
      reposts: 0,
      engagementRatePct: 11.54,
    },
  ],
  "2026-03": [
    {
      date: "2026-03-04",
      title: "Protótipo para produção em escala",
      slidesCount: 1,
      impressions: 180,
      clicks: 33,
      ctrPct: 18.33,
      reactions: 7,
      comments: 0,
      reposts: 0,
      engagementRatePct: 22.22,
    },
    {
      date: "2026-03-05",
      title: "Fornecedor único ponto de falha — fluxo integrado",
      slidesCount: 1,
      impressions: 176,
      clicks: 15,
      ctrPct: 8.52,
      reactions: 5,
      comments: 0,
      reposts: 0,
      engagementRatePct: 11.36,
    },
    {
      date: "2026-03-10",
      title: "Sala limpa ISO 7 — competir com padrão europeu",
      slidesCount: 1,
      impressions: 267,
      clicks: 16,
      ctrPct: 5.99,
      reactions: 10,
      comments: 0,
      reposts: 1,
      engagementRatePct: 10.11,
    },
    {
      date: "2026-03-12",
      title: "Geometria complexa — tornos Swiss Citizen L20/M32",
      slidesCount: 1,
      impressions: 470,
      clicks: 18,
      ctrPct: 3.83,
      reactions: 15,
      comments: 1,
      reposts: 0,
      engagementRatePct: 7.23,
    },
    {
      date: "2026-03-13",
      title: "UDI marcação laser — rastreabilidade em dispositivos",
      slidesCount: 1,
      impressions: 241,
      clicks: 13,
      ctrPct: 5.39,
      reactions: 9,
      comments: 1,
      reposts: 0,
      engagementRatePct: 9.54,
    },
    {
      date: "2026-03-17",
      title: "TCO sourcing — decisões de competitividade 2026",
      slidesCount: 1,
      impressions: 107,
      clicks: 5,
      ctrPct: 4.67,
      reactions: 6,
      comments: 0,
      reposts: 0,
      engagementRatePct: 10.28,
    },
    {
      date: "2026-03-18",
      title: "Port-a-cath: engenharia nacional — Sala Limpa ISO 7",
      slidesCount: 1,
      impressions: 233,
      clicks: 11,
      ctrPct: 4.72,
      reactions: 7,
      comments: 0,
      reposts: 2,
      engagementRatePct: 8.58,
    },
    {
      date: "2026-03-18",
      title: "Metrologia de ponta — onde a engenharia encontra a perfeição",
      slidesCount: 1,
      impressions: 106,
      clicks: 1,
      ctrPct: 0.94,
      reactions: 4,
      comments: 0,
      reposts: 0,
      engagementRatePct: 4.72,
    },
    {
      date: "2026-03-24",
      title: "Parafuso pedicular — precisão como ativo de segurança",
      slidesCount: 1,
      impressions: 140,
      clicks: 12,
      ctrPct: 8.57,
      reactions: 7,
      comments: 0,
      reposts: 0,
      engagementRatePct: 13.57,
    },
  ],
};

function parseMonthRange(month: MonthlyReportKey) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return {
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    endInclusiveIso: new Date(end.getTime() - 1).toISOString().slice(0, 10),
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function classifyTopic(text: string): { category: TopicCategory; icp: ICPGroup } {
  const normalized = normalizeText(text);

  if (
    includesAny(normalized, [
      "anvisa",
      "fda",
      "iso 13485",
      "iso7",
      "iso 7",
      "iso8",
      "iso 8",
      "compliance",
      "qualidade",
      "zero defeito",
      "capa",
      "contaminacao",
      "sala limpa",
      "rastreabilidade",
      "pureza",
    ])
  ) {
    return {
      category: "Quality & Compliance",
      icp: "Quality / Regulatory Leaders",
    };
  }

  if (
    includesAny(normalized, [
      "medicina personalizada",
      "personalizado",
      "caso complexo",
      "ortopedia",
      "coluna",
      "recon",
      "paciente",
      "implante personalizado",
    ])
  ) {
    return {
      category: "Personalized Solutions",
      icp: "R&D / Engineering Teams",
    };
  }

  if (
    includesAny(normalized, [
      "metrologia",
      "zeiss",
      "cmm",
      "dfm",
      "cad",
      "fadiga",
      "3d + cnc",
      "prototipo",
      "ramp-up",
      "usinagem",
      "validacao",
      "swiss",
      "udi",
      "marcacao",
      "laser",
      "citizen",
      "cnc",
      "fixacao",
      "port-a-cath",
      "portacath",
      "kit esteril",
      "kit estéril",
      "geometria",
      "parafuso",
    ])
  ) {
    return {
      category: "Manufacturing & Validation",
      icp: "R&D / Engineering Teams",
    };
  }

  if (
    includesAny(normalized, [
      "supply chain",
      "cadeia",
      "escala",
      "capacidade",
      "nearshoring",
      "importado",
      "importacao",
      "producao local",
      "custo real",
      "cambio",
      "sku",
      "lead time",
      "p&l",
      "sustentabilidade",
      "oem",
      "parceria",
      "operacoes",
      "tco",
      "sourcing",
      "de-risking",
      "frete",
      "tarifa",
      "fornecedor",
    ])
  ) {
    return {
      category: "Supply Chain & Scale",
      icp: "Supply Chain / Operations Leaders",
    };
  }

  if (includesAny(normalized, ["vaga", "emprego", "operador"])) {
    return {
      category: "Corporate & Talent",
      icp: "Talent / Broad Audience",
    };
  }

  return {
    category: "Corporate & Talent",
    icp: "Executive Decision Makers",
  };
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

function getSlidesCount(slides: unknown): number {
  if (Array.isArray(slides)) return slides.length;
  if (typeof slides === "string") {
    try {
      const parsed = JSON.parse(slides);
      if (Array.isArray(parsed)) return parsed.length;
    } catch {
      return 1;
    }
  }
  return 1;
}

function getSlidesBucket(slidesCount: number): "0" | "1" | "2-4" | "5+" {
  if (slidesCount <= 0) return "0";
  if (slidesCount === 1) return "1";
  if (slidesCount <= 4) return "2-4";
  return "5+";
}

function weightedCtr(totalClicks: number, totalImpressions: number): number {
  if (totalImpressions <= 0) return 0;
  return (totalClicks / totalImpressions) * 100;
}

function getSeededPosts(month: MonthlyReportKey): MonthlyPostItem[] {
  return (SEEDED_POSTS[month] || []).map((post, index) => {
    const classification = classifyTopic(post.title);
    return {
      id: `seed-${month}-${index + 1}`,
      ...post,
      category: classification.category,
      icp: classification.icp,
      slidesBucket: getSlidesBucket(post.slidesCount),
    };
  });
}

export function useMonthlyMarketingReport(month: MonthlyReportKey) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MonthlyMarketingReportData | null>(null);

  const range = useMemo(() => parseMonthRange(month), [month]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [postRes, pageRes] = await Promise.all([
        (supabase
          .from("linkedin_carousels" as any)
          .select("id, topic, caption, created_at, slides, performance_metrics")
          .gte("created_at", range.startIso)
          .lt("created_at", range.endIso)
          .order("created_at", { ascending: false }) as any),
        (supabase
          .from("ga4_page_analytics" as any)
          .select(
            "snapshot_date, page_path, page_title, page_views, avg_time_on_page_seconds, bounce_rate",
          )
          .gte("snapshot_date", range.startIso)
          .lt("snapshot_date", range.endIso)
          .not("page_path", "ilike", "/admin%")
          .order("snapshot_date", { ascending: true }) as any),
      ]);

      if (postRes.error) {
        console.warn("LinkedIn monthly report: falling back to seeded posts.", postRes.error);
      }
      if (pageRes.error) throw pageRes.error;

      const latestSnapshotDate: string | null = FALLBACK_FOLLOWER_SNAPSHOT_DATE;
      const followerRows: FollowerIndustryRow[] = [...FALLBACK_FOLLOWER_INDUSTRIES];
      const followerJobFunctions: FollowerIndustryRow[] = [...FALLBACK_FOLLOWER_JOB_FUNCTIONS];

      const rawPosts = postRes.data || [];
      let posts: MonthlyPostItem[] = rawPosts.map((row: any) => {
        const metrics = toObject(row.performance_metrics);
        const title = String(row.topic || row.caption || "Untitled post");
        const classification = classifyTopic(`${row.topic || ""} ${row.caption || ""}`);
        const slidesCount = getSlidesCount(row.slides);

        const impressions =
          toNumber(metrics.impressions) ||
          toNumber(metrics.views);
        const clicks = toNumber(metrics.clicks);
        const reactions =
          toNumber(metrics.reactions) ||
          toNumber(metrics.likes);
        const comments = toNumber(metrics.comments);
        const reposts =
          toNumber(metrics.reposts) ||
          toNumber(metrics.shares);
        const ctrPct = toNumber(metrics.ctr_pct) || toNumber(metrics.ctr) || weightedCtr(clicks, impressions);
        const engagementRatePct =
          toNumber(metrics.engagement_rate) ||
          toNumber(metrics.engagement_rate_pct);

        return {
          id: String(row.id),
          date: String(row.created_at || range.startIso),
          title,
          category: classification.category,
          icp: classification.icp,
          slidesCount,
          slidesBucket: getSlidesBucket(slidesCount),
          impressions,
          clicks,
          ctrPct,
          reactions,
          comments,
          reposts,
          engagementRatePct,
        };
      });

      const hasLiveMetrics = posts.some(
        (post) =>
          post.impressions > 0 ||
          post.clicks > 0 ||
          post.reactions > 0 ||
          post.comments > 0 ||
          post.reposts > 0,
      );
      const seededPosts = getSeededPosts(month);
      const shouldUseSeededPosts =
        seededPosts.length > 0 &&
        (!hasLiveMetrics || posts.length < seededPosts.length);

      if (shouldUseSeededPosts) {
        posts = seededPosts;
      }

      const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
      const totalClicks = posts.reduce((sum, p) => sum + p.clicks, 0);
      const totalInteractions = posts.reduce((sum, p) => sum + p.reactions + p.comments + p.reposts, 0);
      const avgEngagementRate =
        posts.length > 0
          ? posts.reduce((sum, p) => sum + p.engagementRatePct, 0) / posts.length
          : 0;

      const categories = ([
        "Quality & Compliance",
        "Personalized Solutions",
        "Manufacturing & Validation",
        "Supply Chain & Scale",
        "Corporate & Talent",
      ] as TopicCategory[]).map((category) => {
        const items = posts.filter((p) => p.category === category);
        const impressions = items.reduce((sum, p) => sum + p.impressions, 0);
        const clicks = items.reduce((sum, p) => sum + p.clicks, 0);
        const reactions = items.reduce((sum, p) => sum + p.reactions, 0);
        const avgEngagementRatePct =
          items.length > 0
            ? items.reduce((sum, p) => sum + p.engagementRatePct, 0) / items.length
            : 0;

        return {
          category,
          posts: items.length,
          impressions,
          reactions,
          weightedCtrPct: weightedCtr(clicks, impressions),
          avgEngagementRatePct,
        };
      });

      const icpOrder: ICPGroup[] = [
        "Quality / Regulatory Leaders",
        "R&D / Engineering Teams",
        "Supply Chain / Operations Leaders",
        "Executive Decision Makers",
        "Talent / Broad Audience",
      ];

      const icps: ICPSummary[] = icpOrder.map((icp) => {
        const items = posts.filter((p) => p.icp === icp);
        const impressions = items.reduce((sum, p) => sum + p.impressions, 0);
        const clicks = items.reduce((sum, p) => sum + p.clicks, 0);
        const avgEngagementRatePct =
          items.length > 0
            ? items.reduce((sum, p) => sum + p.engagementRatePct, 0) / items.length
            : 0;

        return {
          icp,
          posts: items.length,
          impressions,
          weightedCtrPct: weightedCtr(clicks, impressions),
          avgEngagementRatePct,
        };
      });

      const rawPages = (pageRes.data || []).filter((row: any) => isPublicPagePath(row.page_path));
      const pageMap = new Map<string, PublicPageRow & { timeWeighted: number; bounceWeighted: number }>();
      const dayMap = new Map<string, number>();

      for (const row of rawPages) {
        const path = String(row.page_path || "/");
        const title = String(row.page_title || path);
        const views = toNumber(row.page_views);
        const avgTime = toNumber(row.avg_time_on_page_seconds);
        const bounce = toNumber(row.bounce_rate);
        const date = String(row.snapshot_date);

        dayMap.set(date, (dayMap.get(date) || 0) + views);

        const existing = pageMap.get(path);
        if (existing) {
          existing.pageViews += views;
          existing.timeWeighted += avgTime * views;
          existing.bounceWeighted += bounce * views;
        } else {
          pageMap.set(path, {
            pagePath: path,
            pageTitle: title,
            pageViews: views,
            avgTimeOnPageSeconds: 0,
            bounceRate: 0,
            timeWeighted: avgTime * views,
            bounceWeighted: bounce * views,
          });
        }
      }

      const allPublicPages: PublicPageRow[] = Array.from(pageMap.values())
        .map((page) => ({
          pagePath: page.pagePath,
          pageTitle: page.pageTitle,
          pageViews: page.pageViews,
          avgTimeOnPageSeconds: page.pageViews > 0 ? page.timeWeighted / page.pageViews : 0,
          bounceRate: page.pageViews > 0 ? page.bounceWeighted / page.pageViews : 0,
        }))
        .sort((a, b) => b.pageViews - a.pageViews);

      const topPublicPages = allPublicPages.slice(0, 10);
      const totalPublicViews = allPublicPages.reduce((sum, p) => sum + p.pageViews, 0);
      const weightedAvgTime = allPublicPages.reduce((sum, p) => sum + p.avgTimeOnPageSeconds * p.pageViews, 0);
      const weightedAvgBounce = allPublicPages.reduce((sum, p) => sum + p.bounceRate * p.pageViews, 0);

      const dailyPublicViews = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, pageViews]) => ({
          date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          pageViews,
        }));

      setData({
        month,
        linkedin: {
          summary: {
            posts: posts.length,
            impressions: totalImpressions,
            clicks: totalClicks,
            weightedCtrPct: weightedCtr(totalClicks, totalImpressions),
            totalInteractions,
            avgEngagementRatePct: avgEngagementRate,
          },
          posts,
          categories,
          icps,
        },
        followers: {
          snapshotDate: latestSnapshotDate,
          industries: followerRows,
          jobFunctions: followerJobFunctions,
        },
        ga4: {
          publicPageViews: totalPublicViews,
          publicPagesTracked: allPublicPages.length,
          avgTimeOnPageSeconds: totalPublicViews > 0 ? weightedAvgTime / totalPublicViews : 0,
          avgBounceRate: totalPublicViews > 0 ? weightedAvgBounce / totalPublicViews : 0,
          topPublicPages,
          dailyPublicViews,
        },
      });
    } catch (err) {
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, range.endIso, range.startIso]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
