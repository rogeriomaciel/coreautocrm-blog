if (!process.env.GA4_PROPERTY_ID) {
  process.env.GA4_PROPERTY_ID = '544168154';
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/rogerio/core/coreautocrm-blog/security/gen-lang-client-0596096564-1926acacbda4.json';
}
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function main() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const analyticsDataClient = new BetaAnalyticsDataClient();

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'sessionSourceMedium' }, { name: 'city' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'country',
          stringFilter: {
            value: 'Brazil'
          }
        }
      }
    });

    if (!response.rows || response.rows.length === 0) {
      console.log('No traffic data found for Brazil in the last 30 days.');
      return;
    }

    const rows = response.rows.map(row => ({
      pagePath: row.dimensionValues[0].value,
      source: row.dimensionValues[1].value,
      city: row.dimensionValues[2].value,
      sessions: parseInt(row.metricValues[0].value, 10),
      views: parseInt(row.metricValues[1].value, 10),
      activeUsers: parseInt(row.metricValues[2].value, 10)
    }));

    // Aggregate by page
    const pageStats = {};
    const sourceStats = {};
    const cityStats = {};
    let totalSessions = 0;
    let totalViews = 0;
    let totalUsers = 0;

    rows.forEach(r => {
      totalSessions += r.sessions;
      totalViews += r.views;
      totalUsers += r.activeUsers;

      // Page
      const cleanPath = r.pagePath.split(']')[0];
      if (!pageStats[cleanPath]) pageStats[cleanPath] = { views: 0, sessions: 0 };
      pageStats[cleanPath].views += r.views;
      pageStats[cleanPath].sessions += r.sessions;

      // Source
      if (!sourceStats[r.source]) sourceStats[r.source] = { sessions: 0, views: 0 };
      sourceStats[r.source].sessions += r.sessions;
      sourceStats[r.source].views += r.views;

      // City
      if (!cityStats[r.city]) cityStats[r.city] = { sessions: 0, views: 0 };
      cityStats[r.city].sessions += r.sessions;
      cityStats[r.city].views += r.views;
    });

    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1].views - a[1].views)
      .map(([path, stat]) => ({ path, views: stat.views, sessions: stat.sessions }));

    const topSources = Object.entries(sourceStats)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .map(([source, stat]) => ({ source, sessions: stat.sessions, views: stat.views }));

    const topCities = Object.entries(cityStats)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .map(([city, stat]) => ({ city, sessions: stat.sessions, views: stat.views }));

    console.log(JSON.stringify({
      totals: { totalSessions, totalViews, totalUsers },
      topPages,
      topSources,
      topCities
    }, null, 2));

  } catch(e) {
    console.error(e);
  }
}
main();



