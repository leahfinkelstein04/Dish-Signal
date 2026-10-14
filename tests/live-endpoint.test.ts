// Live Endpoint Test for DishSignal Server
async function runLiveTests() {
  const radii = [1, 3, 5, 10, 25];
  const query = 'strawberry matcha';
  const centerLat = 29.9482; // 821 Baronne St
  const centerLng = -90.0734;

  console.log('Testing live endpoint across all 5 radius settings...');

  for (const radius of radii) {
    const res = await fetch('http://localhost:3000/api/search-dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dish: query,
        lat: centerLat,
        lng: centerLng,
        radiusMiles: radius,
        locationName: '821 Baronne St, New Orleans, LA',
      }),
    });

    if (!res.ok) {
      console.error(`Radius ${radius} failed with HTTP status ${res.status}`);
      process.exit(1);
    }

    const data = await res.json();
    const count = data.restaurants.length;
    const maxDist = data.restaurants.reduce((max: number, r: any) => Math.max(max, r.distanceMiles), 0);

    console.log(`Radius ${radius} mi: ${count} results, max distance: ${maxDist} mi (within radius + 0.05: ${maxDist <= radius + 0.05})`);

    if (maxDist > radius + 0.05) {
      console.error(`FAIL: A restaurant at ${maxDist} mi was returned for radius ${radius} mi!`);
      process.exit(1);
    }
  }

  console.log('\nTesting benchmark dish recognitions on live server:');
  const benchmarkDishes = [
    'Spicy tuna crispy rice',
    'Spicy tuna with crispy rice',
    'Spicey tuna crispie rice',
    'French onion soup',
    'French union soop',
    'Strawberry matcha',
    'Strawbery matcha',
    'Spicy rigatoni',
    'Rigatony vodka',
    'Chicken Caesar wrap',
  ];

  for (const dish of benchmarkDishes) {
    const res = await fetch('http://localhost:3000/api/search-dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dish,
        lat: centerLat,
        lng: centerLng,
        radiusMiles: 3,
        locationName: '821 Baronne St, New Orleans, LA',
      }),
    });

    const data = await res.json();
    console.log(`"${dish}" -> Canonical: "${data.interpretation?.canonicalDish}", Results: ${data.restaurants?.length}, Exact: ${data.exactCount}, Similar: ${data.similarCount}`);
  }

  console.log('\nAll live endpoint tests completed successfully!');
}

runLiveTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
