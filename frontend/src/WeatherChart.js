import React, { useState, useRef, useEffect } from "react";
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
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
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
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatContainerRef = useRef(null);

  const BASE_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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

  const handleChatSubmit = async () => {
    if (chatMessage.trim() === "") return;

    const userMessage = { role: "user", content: chatMessage };
    setChatHistory([...chatHistory, userMessage]);
    setChatMessage("");

    try {
      const response = await fetch(`${BASE_URL}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await response.json();
      const botMessage = { role: "assistant", content: data.reply };
      setChatHistory((prevHistory) => [...prevHistory, botMessage]);
    } catch (error) {
      console.error("Error in chatbot communication:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setChatHistory((prevHistory) => [...prevHistory, errorMessage]);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
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
    <div className="weather-app">
      <header className="app-header">
        <h1>Weather Forecast</h1>
      </header>
      <main className="app-main">
        <section className="search-section">
          <div className="search-container">
            <div className="input-wrapper">
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
        </section>

        {error && <p className="error-message">{error}</p>}

        {!loading && weatherData.length > 0 && (
          <section className="weather-info">
            <h2>{weatherData[0].location}</h2>
            <div className="weather-details">
              <div className="weather-card">
                <h3>Temperature</h3>
                <p>{weatherData[0].temperature}°C</p>
                <p>Feels like: {weatherData[0].feelslike_c}°C</p>
              </div>
              <div className="weather-card">
                <h3>Humidity</h3>
                <p>{weatherData[0].humidity}%</p>
              </div>
              <div className="weather-card">
                <h3>Wind</h3>
                <p>{weatherData[0].wind_mph} mph</p>
                <p>Direction: {weatherData[0].wind_dir}</p>
              </div>
              <div className="weather-card">
                <h3>Condition</h3>
                <p>{weatherData[0].condition.text}</p>
              </div>
              <div className="weather-card">
                <h3>Visibility</h3>
                <p>{weatherData[0].vis_km} km</p>
              </div>
              <div className="weather-card">
                <h3>Pressure</h3>
                <p>{weatherData[0].pressure_mb} mb</p>
              </div>
            </div>
            <p className="last-updated">
              Last Updated: {weatherData[0].last_updated}
            </p>
          </section>
        )}

        {weatherData.length > 0 && (
          <section className="chart-section">
            <h2>Temperature and Humidity Chart</h2>
            <Line data={chartData} />
          </section>
        )}
      </main>

      <button className="chat-toggle" onClick={toggleChat}>
        <FaRobot />
      </button>

      {isChatOpen && (
        <div className="chatbot-container">
          <div className="chat-header">
            <h3>Weather Assistant</h3>
            <button className="close-chat" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>
          <div className="chat-history" ref={chatContainerRef}>
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
              placeholder="Ask about weather..."
            />
            <button onClick={handleChatSubmit}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default WeatherChart;
