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

// Mock: Non-stop destinations for each airport (replace with real API call)
const nonStopDestinations = {
  "LHR": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN", "EZE", "GRU", "SCL"],
  "CDG": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN", "EZE", "GRU"],
  "FRA": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN"],
  "AMS": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS"],
  "MAD": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN", "EZE", "GRU", "SCL"],
  "FCO": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN"],
  "ZRH": ["JFK", "MIA", "MAD", "CDG", "FCO"],
  "IST": ["JFK", "MIA", "MAD", "CDG"],
  "VIE": ["JFK", "MIA", "MAD"],
  "BCN": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN"],
  "MEX": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN", "EZE", "GRU", "SCL"],
  "GRU": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN", "EZE", "GRU", "SCL"],
  "BOG": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN"],
  "LIM": ["JFK", "MIA", "MAD", "CDG", "FCO"],
  "EZE": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN", "EZE"],
  "SCL": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN"],
  "GIG": ["JFK", "MIA", "MAD", "CDG", "FCO", "LIS", "BCN"],
  "PTY": ["JFK", "MIA", "MAD", "CDG", "FCO"],
  "MVD": ["JFK", "MIA", "MAD", "CDG"],
  "UIO": ["JFK", "MIA", "MAD"]
};

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

// Mock: Fetch price for a round-trip non-stop flight (replace with real API call)
async function fetchPrice(origin, dest, startDate, endDate) {
  // Replace with real API call to Google Flights API, Amadeus, or Passabot/Apify
  // Must filter for non-stop flights only
  // For demonstration, return a random price or null if not available
  return Math.random() > 0.1 ? Math.floor(Math.random() * 700) + 150 : null;
}

document.getElementById('flight-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const originEU = document.getElementById('origin-eu').value;
  const originLA = document.getElementById('origin-la').value;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  // Find common non-stop destinations
  const euDest = nonStopDestinations[originEU] || [];
  const laDest = nonStopDestinations[originLA] || [];
  const commonDest = euDest.filter(dest => laDest.includes(dest));

  if (commonDest.length === 0) {
    document.getElementById('results').innerHTML = "<p>No common non-stop destinations found.</p>";
    return;
  }

  // Fetch prices for each destination
  const results = [];
  for (let dest of commonDest) {
    const [priceEU, priceLA] = await Promise.all([
      fetchPrice(originEU, dest, startDate, endDate),
      fetchPrice(originLA, dest, startDate, endDate)
    ]);
    if (priceEU && priceLA) {
      results.push({ dest, priceEU, priceLA, sum: priceEU + priceLA });
    }
  }

  // Sort by total price
  results.sort((a, b) => a.sum - b.sum);

  // Output table
  let html = `
    <h2>Best Common Non-Stop Destinations</h2>
    <table>
      <tr>
        <th>Destination</th>
        <th>Price from ${originEU}</th>
        <th>Price from ${originLA}</th>
        <th>Total Price</th>
      </tr>
  `;
  for (let row of results) {
    html += `
      <tr>
        <td>${row.dest}</td>
        <td>$${row.priceEU}</td>
        <td>$${row.priceLA}</td>
        <td><strong>$${row.sum}</strong></td>
      </tr>
    `;
  }
  html += "</table>";
  document.getElementById('results').innerHTML = html;
});
