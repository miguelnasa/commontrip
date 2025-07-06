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

// Mock: 100 possible destinations (in real app, fetch from API)
const allPossibleDestinations = Array.from({length: 100}, (_, i) => ({
  code: `DST${(i+1).toString().padStart(3, '0')}`,
  name: `Destination ${(i+1)}`
}));

// Mock: Non-stop destinations for each airport (for demo, allow all)
const nonStopDestinations = {};
[...europeAirports, ...latamAirports].forEach(airport => {
  nonStopDestinations[airport.code] = allPossibleDestinations.map(d => d.code);
});

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

// Mock: Fetch price and link for a round-trip non-stop flight (replace with real API call)
async function fetchPriceAndLink(origin, dest, startDate, endDate) {
  // In a real app, replace this with an API call
  // For demonstration, return random price and a Google Flights link
  const price = Math.floor(Math.random() * 700) + 150;
  const link = `https://www.google.com/flights?hl=en#flt=${origin}.${dest}.${startDate}*${dest}.${origin}.${endDate}`;
  return { price, link };
}

document.getElementById('flight-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const originEU = document.getElementById('origin-eu').value;
  const originLA = document.getElementById('origin-la').value;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  // Find up to 100 common non-stop destinations
  const euDest = nonStopDestinations[originEU] || [];
  const laDest = nonStopDestinations[originLA] || [];
  const commonDest = euDest.filter(dest => laDest.includes(dest)).slice(0, 100);

  if (commonDest.length === 0) {
    document.getElementById('results').innerHTML = "<p>No common non-stop destinations found.</p>";
    return;
  }

  // Fetch prices and links for each destination
  const results = [];
  for (let dest of commonDest) {
    const destObj = allPossibleDestinations.find(d => d.code === dest);
    const [eu, la] = await Promise.all([
      fetchPriceAndLink(originEU, dest, startDate, endDate),
      fetchPriceAndLink(originLA, dest, startDate, endDate)
    ]);
    if (eu && la) {
      results.push({
        dest: destObj ? destObj.name : dest,
        destCode: dest,
        priceEU: eu.price,
        linkEU: eu.link,
        priceLA: la.price,
        linkLA: la.link,
        sum: eu.price + la.price
      });
    }
  }

  // Sort by total price and get 10 cheapest
  results.sort((a, b) => a.sum - b.sum);
  const top10 = results.slice(0, 10);

  // Output table
  let html = `
    <h2>10 Cheapest Common Non-Stop Destinations</h2>
    <table>
      <tr>
        <th>Destination</th>
        <th>Price from ${originEU} <br><small>(<a href="#" onclick="return false;">Source</a>)</small></th>
        <th>Price from ${originLA} <br><small>(<a href="#" onclick="return false;">Source</a>)</small></th>
        <th>Total Price</th>
      </tr>
  `;
  for (let row of top10) {
    html += `
      <tr>
        <td>${row.dest} (${row.destCode})</td>
        <td>
          $${row.priceEU}
          <br>
          <a href="${row.linkEU}" target="_blank">View Ticket</a>
        </td>
        <td>
          $${row.priceLA}
          <br>
          <a href="${row.linkLA}" target="_blank">View Ticket</a>
        </td>
        <td><strong>$${row.sum}</strong></td>
      </tr>
    `;
  }
  html += "</table>";
  document.getElementById('results').innerHTML = html;
});
