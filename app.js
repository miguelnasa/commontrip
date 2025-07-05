// Example airport and destination data
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

const destinations = [
  { code: "JFK", name: "New York" },
  { code: "MIA", name: "Miami" },
  { code: "CUN", name: "Cancun" },
  { code: "MAD", name: "Madrid" },
  { code: "CDG", name: "Paris" },
  { code: "FCO", name: "Rome" },
  { code: "LIS", name: "Lisbon" },
  { code: "LHR", name: "London" },
  { code: "BCN", name: "Barcelona" },
  { code: "EZE", name: "Buenos Aires" }
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

populateSelect('origin1', europeAirports);
populateSelect('origin2', latamAirports);
populateSelect('destination', destinations);

// Example function to fetch prices (replace with real API call)
async function fetchFlightPrice(origin, destination) {
  // Replace with real API call to Google Flights API via SearchAPI or SerpAPI
  // Example: https://www.searchapi.io/api/v1/search?engine=google_flights&departure_id=origin&arrival_id=destination&flight_type=one_way&outbound_date=2025-07-10
  // For demo, return a random price
  return Math.floor(Math.random() * 800) + 100;
}

document.getElementById('flight-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const origin1 = document.getElementById('origin1').value;
  const origin2 = document.getElementById('origin2').value;
  const destination = document.getElementById('destination').value;

  const [price1, price2] = await Promise.all([
    fetchFlightPrice(origin1, destination),
    fetchFlightPrice(origin2, destination)
  ]);

  const total = price1 + price2;

  document.getElementById('results').innerHTML = `
    <h2>Price Comparison</h2>
    <table>
      <tr><th>Origin</th><th>Destination</th><th>Price (USD)</th></tr>
      <tr><td>${origin1}</td><td>${destination}</td><td>$${price1}</td></tr>
      <tr><td>${origin2}</td><td>${destination}</td><td>$${price2}</td></tr>
      <tr><td colspan="2"><strong>Total</strong></td><td><strong>$${total}</strong></td></tr>
    </table>
  `;
});
