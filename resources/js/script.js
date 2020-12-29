// Retrieve search query from local storage and make sure service worker is supported
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw_cached_site.min.js')
            .then(reg => {
                console.log('Service worker registration sucessful');
            }).catch(err => {
                console.log('Service worker registration failed');
            });
    }

    try {
        const json = localStorage.getItem('searchQuery');
        const searchQuery = JSON.parse(json);

        if (searchQuery) {
            document.querySelector('#query').setAttribute('value', searchQuery);
            getWeatherInfo(searchQuery);
        }
    } catch (e) {
        // Do nothing
    }
});

const dateConverter = unix_timestamp => {
    const daysInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(unix_timestamp * 1000);
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = '0' + date.getMinutes();
    const formattedTime = `${daysInWeek[day]}, ${hours}:${minutes.substr(-2)}`;
    return formattedTime;
};

// mocked response.json() object to prevent messing up the UI
const mockJsonResponse = {
    'weather': [
        {
            'main': '',
            'description': '',
            'icon': ''
        }
    ],
    'main': {
        'temp': '',
    },
    'sys': {
        'country': '',

    },
    'name': '',
    'dt': ''
};

// // Weather Search functionality begins here
const getWeatherInfo = (location, method) => {
    let search;
    if (method === 'geolocation') {
        const { lat, lon } = location;
        search = `lat=${lat}&lon=${lon}`;
    } else {
        search = `q=${location}`;
    }

    const key = '{YOUR_API_KEY}';
    const units = 'metric';
    const url = `https://api.openweathermap.org/data/2.5/weather?${search}&appid=${key}&units=${units}`;
    fetch(url)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else if (response.status === 404) {
                return {
                    ...mockJsonResponse,
                    'error': 'City not found. Please Check your spelling or try searching for something else.',
                    'cod': 404
                };
            } else {
                return {
                    ...mockJsonResponse,
                    'error': 'Oops! An error occured. Please try again.',
                    'cod': -1
                };
            }
        })
        .then(data => displayWeatherInfo(data))
        .catch(err => {
            displayWeatherError();
        });
};

const handleWeatherSearch = e => {
    e.preventDefault();
    const value = e.target.elements.query.value.trim();
    if (value) {
        document.querySelector('.loading-box').classList.remove('display-none');
        getWeatherInfo(value);

        // Save search query to local storage
        const json = JSON.stringify(value);
        localStorage.setItem('searchQuery', json);
    } else {
        document.querySelector('.weather__error').innerHTML = 'Please provide a valid city name.';
        document.querySelector('.weather__error--tip').innerHTML = 'Tip: Search by - City name, Country e.g. Shuzenji, JP';
        document.querySelector('.weather__icon').innerHTML = '';
        document.querySelector('.weather__description').innerHTML = '';
        document.querySelector('.weather__temp').innerHTML = '';
        document.querySelector('.weather__time').innerHTML = '';
        document.querySelector('.weather__location').innerHTML = '';
        document.querySelector('.weather').classList.remove('display-none');
    }
};

document.querySelector('form').addEventListener('submit', handleWeatherSearch);

const displayWeatherInfo = data => {
    const weatherMain = data.weather[0].main.toLowerCase();
    const { description } = data.weather[0];
    const { temp } = data.main;
    const { icon } = data.weather[0];
    const { name } = data;
    const { country } = data.sys;

    let weatherTime = data.dt;
    if (data.dt) {
        weatherTime = dateConverter(data.dt);
    }

    let error;
    if (data.cod !== 200) {
        error = data.error;
        document.querySelector('.weather__error').innerHTML = error;
        document.querySelector('.weather__error--tip').innerHTML = 'Tip: Search by - City name, Country e.g. Shuzenji, JP';
    } else {
        document.querySelector('.weather__error').innerHTML = '';
        document.querySelector('.weather__error--tip').innerHTML = '';
    }

    document.querySelector('.weather__icon').innerHTML = icon && `<img src=/resources/img/icons/${icon}.png alt=weather-icon>`;
    document.querySelector('.weather__description').innerHTML = description;
    document.querySelector('.weather__temp').innerHTML = temp && `${temp}&deg;`;
    document.querySelector('.weather__time').innerHTML = weatherTime && `as of ${weatherTime} UTC`;
    document.querySelector('.weather__location').innerHTML = name && `${name}, ${country}.`;
    document.querySelector('.loading-box').classList.add('display-none');
    document.querySelector('.weather').classList.remove('display-none');

    //change body theme based on weather condition
    switch (weatherMain) {
        case 'thunderstorm':
            document.body.className = 'thunderstorm';
            break;

        case 'drizzle':
            document.body.className = 'drizzle';
            break;

        case 'rain':
            document.body.className = 'rain';
            break;

        case 'snow':
            document.body.className = 'snow';
            break;

        case 'clear':
            if (icon.includes('d')) {
                document.body.className = 'clear__day';
            } else {
                document.body.className = 'clear__night';
            }
            break;

        case 'clouds':
            document.body.className = 'clouds';
            break;

        default:
            document.body.className = 'others';
    }
};

// If fetch fails
const displayWeatherError = () => {
    document.querySelector('.weather__icon').innerHTML = '';
    document.querySelector('.weather__temp').innerHTML = '';
    document.querySelector('.weather__time').innerHTML = '';
    document.querySelector('.weather__error').innerHTML = 'Unable to get weather information'
    document.querySelector('.weather__error--tip').innerHTML = 'Tip: You might be offline. Check your internet connection and try again';
    document.querySelector('.weather__description').innerHTML = '';
    document.querySelector('.weather__location').innerHTML = '';
    document.querySelector('.loading-box').classList.add('display-none');
    document.querySelector('.weather').classList.remove('display-none');
    document.body.className = 'offline';
};