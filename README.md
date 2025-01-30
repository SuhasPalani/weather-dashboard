# Weather Dashboard with Chatbot Assistant

This project is a weather dashboard built using **React.js** for the frontend and **Flask** for the backend. It provides real-time weather data, as well as a chatbot assistant that can answer weather-related queries. The application retrieves weather data from a third-party API and allows users to search for weather information based on location.

## Features
- Real-time weather information (temperature, humidity, wind speed, visibility, etc.)
- Chatbot assistant powered by OpenAI, answering weather-related queries
- Location search suggestions based on user input
- Data is fetched and stored in MongoDB for future use

## Technologies Used
- **Frontend**: React.js, Chart.js, React Icons
- **Backend**: Flask, MongoDB, OpenAI API, WeatherAPI
- **Database**: MongoDB
- **Environment Variables**: `.env` file for sensitive information

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.x
- MongoDB (Local or Cloud instance)
- OpenAI API Key
- WeatherAPI Key

### 1. Backend Setup (Flask)

#### a. Clone the repository:
```bash
git clone https://github.com/your-username/weather-dashboard.git
cd weather-dashboard/backend
```

#### b. Install Python dependencies:
Ensure that you have `pip` installed, then run:
```bash
pip install -r requirements.txt
```

#### c. Set up environment variables:
Create a `.env` file in the `backend` directory and add the following variables:

```bash
MONGODB_URI=your-mongodb-uri
OPENAI_API_KEY=your-openai-api-key
API_KEY=your-weather-api-key
```

#### d. Start the backend server:
```bash
python app.py
```
The backend server will start on `http://127.0.0.1:5000`.

### 2. Frontend Setup (React)

#### a. Navigate to the frontend directory:
```bash
cd weather-dashboard/frontend
```

#### b. Install Node.js dependencies:
```bash
npm install
```

#### c. Start the frontend server:
```bash
npm start
```
The React frontend will be available on `http://localhost:3000`.

### 3. Testing
- After both the backend and frontend are running, you can test the app by searching for different cities or states in the search bar.
- You can also interact with the Weather Assistant by clicking on the chatbot icon and asking weather-related questions.

## API Endpoints

### 1. `/fetch-weather` (POST)
- **Description**: Fetches and stores weather data for a given location (city, state, or zip code).
- **Request Body**:
  ```json
  {
    "location": "Chicago"
  }
  ```
- **Response**: Returns the weather data for the location.

### 2. `/weather-data` (GET)
- **Description**: Retrieves the most recent weather data for a specific location.
- **Query Parameter**:
  - `location`: City and state in the format `city, state` (e.g., `Chicago, IL`).
- **Response**: Returns the weather data for the location.

### 3. `/suggestions` (GET)
- **Description**: Provides location suggestions based on a query (city or state name).
- **Query Parameter**:
  - `query`: The search term for city or state.
- **Response**: Returns a list of location suggestions.

### 4. `/chatbot` (POST)
- **Description**: Interacts with the chatbot assistant. The assistant answers weather-related queries based on the available data.
- **Request Body**:
  ```json
  {
    "message": "What's the weather like in New York?"
  }
  ```
- **Response**: Returns a reply from the chatbot assistant based on the weather data.


## Troubleshooting

- **Error 404/No Data Found**: Ensure that the location is entered correctly, and the backend is properly fetching weather data from the WeatherAPI.
- **CORS Issues**: Make sure you have the correct CORS settings enabled in Flask.
- **Chatbot Not Responding**: Check if the OpenAI API key is correctly configured in the backend `.env` file.

## Contributing
Feel free to fork this repository, submit issues, or create pull requests. Contributions are always welcome!

