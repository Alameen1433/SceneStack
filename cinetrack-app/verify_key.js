require('dotenv').config();

const token = process.env.VITE_TMDB_API_READ_ACCESS_TOKEN;
const url = 'https://api.themoviedb.org/3/authentication';

console.log('Testing API Key...');

fetch(url, {
    headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json'
    }
})
    .then(res => {
        if (res.ok) {
            console.log('API Key is VALID.');
            return res.json();
        } else {
            console.error('API Key is INVALID. Status:', res.status);
            return res.text().then(text => { throw new Error(text) });
        }
    })
    .then(data => console.log('Success:', data))
    .catch(err => console.error('Error:', err));
