import { useEffect, useState, useRef } from 'react';
import './App.css';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import logo from './mlh-prep.png';
import WeatherMap from './components/WeatherMap/WeatherMap';
import cities from './assets/data/cities.json';

// We need this transformation because ReactSearchAutocomplete only accepts object lists
const cityList = (() => {
  const objectList = [];
  cities.forEach((city) => {
    objectList.push({ n: city });
  });

  return objectList;
})();

function App() {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadedForecast, setIsLoadedForecast] = useState(false);
  const [city, setCity] = useState(null);
  const [results, setResults] = useState(null);
  const [resultsForecast, setResultsForecast] = useState(null);
  const [cityCoordinates, setCityCoordinates] = useState({
    lat: '51.505',
    lon: '-0.09',
  });
  const scrl = useRef(null);
  const [currentSearch, setCurrentSearch] = useState('');
  const numberOfDaysForecast = 20;
  let weatherStatus = '';
  let date = null;
  let forecastElement = null;
  const forecast = [];
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.REACT_APP_APIKEY}`
        )
          .then((res) => res.json())
          .then((result) => {
            setIsLoaded(true);
            setResults(result);
            setCity(`${result.name}, ${result.sys.country}`);
            setCityCoordinates({
              lat: result.coord.lat,
              lon: result.coord.lon,
            });
          })
          .catch((err) => {
            setIsLoaded(true);
            setError(err);
          });

          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&cnt=${numberOfDaysForecast}&appid=${process.env.REACT_APP_APIKEY}`
          )
            .then((res) => res.json())
            .then((resultForecast) => {
              setIsLoadedForecast(true);
              setResultsForecast(resultForecast);
            })
            .catch((err) => {
              setIsLoadedForecast(false);
              setError(err);
            });
      },
      () => {
        setCity('');
      }
    );
  }, []);

  useEffect(() => {
    setResults(null);
    setIsLoaded(false);
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.REACT_APP_APIKEY}`
    )
      .then((res) => res.json())
      .then(
        (result) => {
          if (result.cod === 200) {
            setResults(result);
            setCity(`${result.name}, ${result.sys.country}`);
            setCityCoordinates({
              lat: result.coord.lat,
              lon: result.coord.lon,
            });
          } else {
            setResults(null);
          }
        },
        (err) => {
          setError(err);
        }
      )
      .finally(() => {
        setIsLoaded(true);
      });
  }, [city]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (resultsForecast) {
    forecast.push([]);
    forecast.push([]);
    forecast.push([]);
    for(let i=0; i<numberOfDaysForecast; i+=1){
      weatherStatus = resultsForecast.list[i].weather[0].main;
      date = new Date(resultsForecast.list[i].dt * 1000);
      if (weatherStatus === "Clouds")
        forecastElement = <img src="weather-cloudy.png" alt="cloudy"/>;
      else if(weatherStatus === "Clear")
        forecastElement = <img src="weather-sunny.png" alt="clear"/>;
      else if (weatherStatus === "Rain")
        forecastElement = <img src="weather-rainy.png" alt="rainy"/>;
      forecast[0].push(<td className='forecastIcon'>{forecastElement}</td>);
      forecast[1].push(<td className='forecastIcon'>{`${date.getDate()} ${date.toLocaleString('default', {month: 'short'})} ${date.getHours()}:00`}</td>);
      forecast[2].push(<td className='forecastIcon'>{`Min:${Math.round(resultsForecast.list[i].main.temp_min - 273)}/Max:${Math.round(resultsForecast.list[i].main.temp_max - 273)}`}</td>);
    }
  }

  const scroll = (shift) => {
    scrl.current.scrollLeft += shift;
  };

  return (
    <>
      <img className="logo" src={logo} alt="MLH Prep Logo" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2>Enter a city below 👇</h2>
        <div id="weather-location-search">
          <ReactSearchAutocomplete
            items={[
              {
                n: currentSearch,
              },
              ...cityList,
            ]}
            fuseOptions={{
              keys: ['n'],
            }}
            resultStringKeyName="n"
            onSelect={(selectedCity) => setCity(selectedCity.n)}
            onSearch={(search) => setCurrentSearch(search)}
            styling={{
              borderRadius: '5px',
            }}
            inputSearchString={city ?? 'Loading Your Location...'}
          />
        </div>
        <div className="Results">
          {!isLoaded && <h2>Loading...</h2>}
          {isLoaded && results && (
            <>
              <h3>{results.weather[0].main}</h3>
              <p>Feels like {results.main.feels_like}°C</p>
              <i>
                <p>
                  {results.name}, {results.sys.country}
                </p>
              </i>
            </>
          )}
          {isLoaded && !results && <h2>No Results Found</h2>}
        </div>
        {isLoadedForecast && (
          <>
            <table>
              <td>
                <button type='button' onClick={() => scroll(-100)} className='forecastScrollButton'><img height={50} src='left-arrow.png' alt='scroll-left'/></button>
              </td>
              <td>
                <button type='button' onClick={() => scroll(100)} className='forecastScrollButton'><img height={50} src='right-arrow.png' alt='scroll-right'/></button>
              </td>
            </table>
            <div ref={scrl} className="ResultsSlider">
              
              <table>
                <tr>{forecast[0]}</tr>
                <tr>{forecast[1]}</tr>
                <tr>{forecast[2]}</tr>
              </table>
            </div>
          </>
        )}

      </div>
      <div className="weather-map">
        {(!isLoaded || results) && (
          <WeatherMap
            city={city}
            setCity={setCity}
            cityCoordinates={cityCoordinates}
            setCityCoordinates={setCityCoordinates}
          />
        )}
      </div>
    </>
  );
}

export default App;
