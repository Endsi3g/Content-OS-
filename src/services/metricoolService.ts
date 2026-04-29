const METRICOOL_API_BASE = 'https://app.metricool.com/api/v2';

export interface MetricoolAnalytics {
  facebook: { followers: number; engagement: number };
  instagram: { followers: number; engagement: number };
  x: { followers: number; engagement: number };
  linkedin: { followers: number; engagement: number };
  website: { visits: number; bounceRate: number };
}

export async function fetchMetricoolAnalytics(): Promise<MetricoolAnalytics> {
  const apiKey = import.meta.env.VITE_METRICOOL_API_KEY;

  if (!apiKey) {
    // Return demo data when no API key is configured
    return {
      facebook: { followers: 0, engagement: 0 },
      instagram: { followers: 0, engagement: 0 },
      x: { followers: 0, engagement: 0 },
      linkedin: { followers: 0, engagement: 0 },
      website: { visits: 0, bounceRate: 0 },
    };
  }

  const response = await fetch(`${METRICOOL_API_BASE}/stats`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Metricool API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;

  return {
    facebook: {
      followers: data?.facebook?.followers ?? 0,
      engagement: data?.facebook?.engagement ?? 0,
    },
    instagram: {
      followers: data?.instagram?.followers ?? 0,
      engagement: data?.instagram?.engagement ?? 0,
    },
    x: {
      followers: data?.twitter?.followers ?? 0,
      engagement: data?.twitter?.engagement ?? 0,
    },
    linkedin: {
      followers: data?.linkedin?.followers ?? 0,
      engagement: data?.linkedin?.engagement ?? 0,
    },
    website: {
      visits: data?.website?.sessions ?? 0,
      bounceRate: data?.website?.bounceRate ?? 0,
    },
  };
}
