// ====== CONFIGURATION ======
// Replace with your Amadeus API credentials
const AMADEUS_CLIENT_ID = 'eGgZXXMawgAd40jNU6mAh3oNSANeGuyK';
const AMADEUS_CLIENT_SECRET = 'HPAmolWdnuvNzy2N';
let AMADEUS_ACCESS_TOKEN = null;

// ====== AMADEUS API HELPERS ======

// Get Amadeus access token
async function getAmadeusToken() {
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`
  });
  const data = await response.json();
  return data.access_token;
}

// Fetch price for a round-trip from origin to destination
async function fetchPrice(origin, destination, departureDate, returnDate) {
  if (!AMADEUS_ACCESS_TOKEN) {
    AMADEUS_ACCESS_TOKEN = await getAmadeusToken();
  }
  const url = `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${origin}&departureDate=${departureDate}&returnDate=${returnDate}&oneWay=false&max=100`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AMADEUS_ACCESS_TOKEN}` }
  });
  const data = await response.json();
  if (!data.data) return null;
  const found = data.data.find(d => d.destination === destination);
  return found ? parseFloat(found.price.total) : null;
}

// Get airport/city name from Amadeus location API (with caching)
const locationCache = {};
async function fetchLocationName(iataCode) {
  if (locationCache[iataCode]) return locationCache[iataCode];
  if (!AMADEUS_ACCESS_TOKEN) {
    AMADEUS_ACCESS_TOKEN = await getAmadeusToken();
  }
  const url = `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${iataCode}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AMADEUS_ACCESS_TOKEN}` }
  });
  const data = await response.json();
  let name = iataCode;
  if (data && data.data && data.data.length > 0) {
    name = data.data[0].name;
  }
  locationCache[iataCode] = name;
  return name;
}

// ====== MAIN EVENT HANDLER ======

document.getElementById('flight-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Get and sanitize input
  const origin1 = document.getElementById('origin1').value.trim().toUpperCase();
  const origin2 = document.getElementById('origin2').value.trim().toUpperCase();
  const destinations = [
    document.getElementById('destination1').value.trim().toUpperCase(),
    document.getElementById('destination2').value.trim().toUpperCase(),
    document.getElementById('destination3').value.trim().toUpperCase()
  ];
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  document.getElementById('results').innerHTML = "<p>Loading, please wait...</p>";

  try {
    // Fetch prices for each origin-destination pair
    let results = [];
    for (let dest of destinations) {
      const [price1, price2, destName] = await Promise.all([
        fetchPrice(origin1, dest, startDate, endDate),
        fetchPrice(origin2, dest, startDate, endDate),
        fetchLocationName(dest)
      ]);
      if (price1 && price2) {
        results.push({
          dest: destName,
          destCode: dest,
          price1,
          price2,
          sum: price1 + price2,
          link1: `https://www.google.com/flights?hl=en#flt=${origin1}.${dest}.${startDate}*${dest}.${origin1}.${endDate}`,
          link2: `https://www.google.com/flights?hl=en#flt=${origin2}.${dest}.${startDate}*${dest}.${origin2}.${endDate}`
        });
      }
    }

    // Sort by total price
    results.sort((a, b) => a.sum - b.sum);

    if (results.length === 0) {
      document.getElementById('results').innerHTML = "<p>No results found for the given origins and destinations.</p>";
      return;
    }

    // Output table
    let html = `
      <h2>Price Comparison for Selected Destinations</h2>
      <table>
        <tr>
          <th>Destination</th>
          <th>Price from ${origin1}</th>
          <th>Price from ${origin2}</th>
          <th>Total Price</th>
        </tr>
    `;
    for (let row of results) {
      html += `
        <tr>
          <td>${row.dest}</td>
          <td>
            $${row.price1.toFixed(2)}
            <br>
            <a href="${row.link1}" target="_blank">View Ticket</a>
          </td>
          <td>
            $${row.price2.toFixed(2)}
            <br>
            <a href="${row.link2}" target="_blank">View Ticket</a>
          </td>
          <td><strong>$${row.sum.toFixed(2)}</strong></td>
        </tr>
      `;
    }
    html += "</table>";
    document.getElementById('results').innerHTML = html;
  } catch (err) {
    document.getElementById('results').innerHTML = "<p>Error fetching results. Please try again later.</p>";
    console.error(err);
  }
});
