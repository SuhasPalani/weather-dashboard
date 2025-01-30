import React from 'react';
import WeatherChart from './WeatherChart';
import './App.css';

const App = () => {
  return (
    <div className="app-container">
      <h1>Weather Dashboard</h1>
      <WeatherChart />
    </div>
  );
};

export default App;
