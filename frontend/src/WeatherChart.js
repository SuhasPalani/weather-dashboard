import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeatherChart = () => {
  const [location, setLocation] = useState("");
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const BASE_URL = "http://127.0.0.1:5000";

  const fetchWeatherData = async (loc) => {
    setLoading(true);
    setError(null);
    try {
      const fetchResponse = await fetch(`${BASE_URL}/fetch-weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc }),
      });
      const fetchData = await fetchResponse.json();
      if (fetchResponse.ok) {
        setWeatherData([fetchData.data]);
      } else {
        setError(fetchData.error || "Failed to fetch weather data");
      }
    } catch (err) {
      setError("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (location) {
      fetchWeatherData(location);
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setLocation(value);
    if (value.length > 1) {
      const response = await fetch(`${BASE_URL}/suggestions?query=${value}`);
      const data = await response.json();
      setSuggestions(data);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocation(
      suggestion.name +
        (suggestion.type === "city" ? `, ${suggestion.state}` : "")
    );
    setSuggestions([]);
    fetchWeatherData(
      suggestion.name +
        (suggestion.type === "city" ? `, ${suggestion.state}` : "")
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Chart data
  const chartData = {
    labels: weatherData.map((item) =>
      new Date(item.timestamp * 1000).toLocaleTimeString()
    ),
    datasets: [
      {
        label: "Temperature (°C)",
        data: weatherData.map((item) => item.temperature),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Humidity (%)",
        data: weatherData.map((item) => item.humidity),
        borderColor: "rgba(153,102,255,1)",
        backgroundColor: "rgba(153,102,255,0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="weather-chart-container">
      <h2>Weather Data</h2>
      <div className="search-controls">
        <div className="search-input-container">
          <input
            type="text"
            value={location}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter city, state, or zip code"
            className="search-input"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.name}{" "}
                  {suggestion.type === "city" && `(${suggestion.state})`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {!loading && weatherData.length > 0 ? (
        <div>
          <h3>{weatherData[0].location}</h3>
          <p>Temperature: {weatherData[0].temperature}°C</p>
          <p>Humidity: {weatherData[0].humidity}%</p>
          <p>Wind Speed: {weatherData[0].wind_mph} mph</p>
          <p>Wind Direction: {weatherData[0].wind_dir}</p>
          <p>Condition: {weatherData[0].condition.text}</p>
          <p>Last Updated: {weatherData[0].last_updated}</p>
          <p>Pressure: {weatherData[0].pressure_mb} mb</p>
          <p>Feels Like: {weatherData[0].feelslike_c}°C</p>
          <p>Dew Point: {weatherData[0].dewpoint_c}°C</p>
          <p>Visibility: {weatherData[0].vis_km} km</p>
        </div>
      ) : (
        <p>{loading ? "Fetching data..." : "No data available."}</p>
      )}
      {weatherData.length > 0 && <Line data={chartData} />}
    </div>
  );
};

export default WeatherChart;
