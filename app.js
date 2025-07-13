// ====== CONFIGURATION ======
// Replace with your Amadeus API credentials
const AMADEUS_CLIENT_ID = 'eGgZXXMawgAd40jNU6mAh3oNSANeGuyK';
const AMADEUS_CLIENT_SECRET = 'HPAmolWdnuvNzy2N';
let AMADEUS_ACCESS_TOKEN = null;

// Main airports for Europe and Latin America
const europeAirports = [
  { code: "LHR", name: "London Heathrow" },
  { code: "CDG", name: "Paris Charles de Gaulle" },
  { code: "FRA", name: "Frankfurt" },
  { code: "AMS", name: "Amsterdam Schiphol" },
  { code: "MAD", name: "Madrid Barajas" },
  { code: "FCO", name: "Rome Fiumicino" },
  { code: "ZRH", name: "Zurich" },
  { code: "IST", name: "Istanbul" },
  { code: "VIE", name: "Vienna" },
  { code: "BCN", name: "Barcelona" }
];

const latamAirports = [
  { code: "MEX", name: "Mexico City" },
  { code: "GRU", name: "São Paulo Guarulhos" },
  { code: "BOG", name: "Bogotá El Dorado" },
  { code: "LIM", name: "Lima Jorge Chávez" },
  { code: "EZE", name: "Buenos Aires Ezeiza" },
  { code: "SCL", name: "Santiago de Chile" },
  { code: "GIG", name: "Rio de Janeiro Galeão" },
  { code: "PTY", name: "Panama City Tocumen" },
  { code: "MVD", name: "Montevideo Carrasco" },
  { code: "UIO", name: "Quito Mariscal Sucre" }
];

// Populate dropdowns
function populateSelect(id, options) {
  const select = document.getElementById(id);
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.code;
    option.textContent = `${opt.name} (${opt.code})`;
    select.appendChild(option);
  });
}
populateSelect('origin-eu', europeAirports);
populateSelect('origin-la', latamAirports);

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

// Fetch destinations from Amadeus Flight Inspiration Search API
async function fetchDestinations(origin, departureDate, returnDate) {
  if (!AMADEUS_ACCESS_TOKEN) {
    AMADEUS_ACCESS_TOKEN = await getAmadeusToken();
  }
  const url = `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${origin}&departureDate=${departureDate}&returnDate=${returnDate}&oneWay=false&max=100`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AMADEUS_ACCESS_TOKEN}` }
  });
  const data = await response.json();
  return data.data || [];
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
  const originEU = document.getElementById('origin-eu').value;
  const originLA = document.getElementById('origin-la').value;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  document.getElementById('results').innerHTML = "<p>Loading, please wait...</p>";

  try {
    // Fetch up to 100 destinations for each origin
    let [euDestList, laDestList] = await Promise.all([
      fetchDestinations(originEU, startDate, endDate),
      fetchDestinations(originLA, startDate, endDate)
    ]);

    // Build maps for quick lookup
    let euMap = {};
    euDestList.forEach(d => { euMap[d.destination] = d; });
    let laMap = {};
    laDestList.forEach(d => { laMap[d.destination] = d; });

    // Find common destinations
    let common = Object.keys(euMap).filter(dest => laMap[dest]);
    if (common.length === 0) {
      document.getElementById('results').innerHTML = "<p>No common destinations found.</p>";
      return;
    }

    // For each common destination, get prices and names
    let results = [];
    for (let dest of common) {
      const euPrice = euMap[dest].price.total ? parseFloat(euMap[dest].price.total) : null;
      const laPrice = laMap[dest].price.total ? parseFloat(laMap[dest].price.total) : null;
      if (euPrice && laPrice) {
        const destName = await fetchLocationName(dest);
        results.push({
          dest: destName,
          destCode: dest,
          priceEU: euPrice,
          priceLA: laPrice,
          sum: euPrice + laPrice,
          linkEU: `https://www.google.com/flights?hl=en#flt=${originEU}.${dest}.${startDate}*${dest}.${originEU}.${endDate}`,
          linkLA: `https://www.google.com/flights?hl=en#flt=${originLA}.${dest}.${startDate}*${dest}.${originLA}.${endDate}`
        });
      }
    }

    // Sort by total price and get 10 cheapest
    results.sort((a, b) => a.sum - b.sum);
    const top10 = results.slice(0, 10);

    // Output table
    let html = `
      <h2>10 Cheapest Common Destinations</h2>
      <table>
        <tr>
          <th>Destination</th>
          <th>Price from ${originEU}</th>
          <th>Price from ${originLA}</th>
          <th>Total Price</th>
        </tr>
    `;
    for (let row of top10) {
      html += `
        <tr>
          <td>${row.dest}</td>
          <td>
            $${row.priceEU.toFixed(2)}
            <br>
            <a href="${row.linkEU}" target="_blank">View Ticket</a>
          </td>
          <td>
            $${row.priceLA.toFixed(2)}
            <br>
            <a href="${row.linkLA}" target="_blank">View Ticket</a>
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
