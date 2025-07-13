// Replace these with your Amadeus API credentials
const CLIENT_ID = 'YOUR_AMADEUS_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_AMADEUS_CLIENT_SECRET';

const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const FLIGHT_OFFERS_URL = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

// Get OAuth2 token from Amadeus
async function getAccessToken() {
    const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    });
    const data = await response.json();
    return data.access_token;
}

// Fetch flight price from Amadeus
async function fetchFlightPrice(origin, destination, departureDate, token) {
    const url = `${FLIGHT_OFFERS_URL}?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=1&nonStop=false&max=1`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

// Handle form submission
document.getElementById('flight-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const origin = document.getElementById('origin').value.trim().toUpperCase();
    const destination = document.getElementById('destination').value.trim().toUpperCase();
    const departureDate = document.getElementById('departure-date').value;

    document.getElementById('result').textContent = 'Searching...';

    try {
        const token = await getAccessToken();
        const data = await fetchFlightPrice(origin, destination, departureDate, token);

        if (data && data.data && data.data.length > 0) {
            const offer = data.data[0];
            const price = offer.price.total;
            const currency = offer.price.currency;
            document.getElementById('result').textContent = 
                `Lowest price: ${price} ${currency}`;
        } else {
            document.getElementById('result').textContent = 
                'No flights found for the selected route and date.';
        }
    } catch (error) {
        document.getElementById('result').textContent = 
            'Error fetching flight price. Please check your inputs and try again.';
        console.error(error);
    }
});
