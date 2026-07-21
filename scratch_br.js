const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function main() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const analyticsDataClient = new BetaAnalyticsDataClient();

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }, { name: 'sessionSourceMedium' }, { name: 'city' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'country',
          stringFilter: {
            value: 'Brazil'
          }
        }
      }
    });

    if (!response.rows) {
      console.log(JSON.stringify({ result: 'No rows' }));
      return;
    }

    const results = response.rows.map(row => ({
      pageTitle: row.dimensionValues[0].value,
      source: row.dimensionValues[1].value,
      city: row.dimensionValues[2].value,
      sessions: row.metricValues[0].value,
      views: row.metricValues[1].value
    }));

    console.log(JSON.stringify(results, null, 2));
  } catch(e) {
    console.error(e);
  }
}
main();
