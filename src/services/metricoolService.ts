export const fetchMetricoolAnalytics = async () => {
  // Simulate API call to Metricool
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        facebook: { followers: 1200, engagement: 4.5 },
        instagram: { followers: 3500, engagement: 6.2 },
        x: { followers: 800, engagement: 2.1 },
        linkedin: { followers: 500, engagement: 3.8 },
        website: { visits: 5000, bounceRate: 45 },
      });
    }, 1000);
  });
};
