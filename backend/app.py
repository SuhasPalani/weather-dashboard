import os
from flask import Flask, jsonify, request
from pymongo import MongoClient
import requests
from dotenv import load_dotenv
from flask_cors import CORS
import openai
import re
from spellchecker import SpellChecker

# Load environment variables from the .env file
load_dotenv()

# Flask app setup
app = Flask(__name__)
CORS(app)

# MongoDB connection using the URI from the .env file
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.weather_database
collection = db.weather_data

openai.api_key = os.getenv("OPENAI_API_KEY")

# WeatherAPI configuration using the API key from the .env file
WEATHER_API_URL = "http://api.weatherapi.com/v1/current.json"
API_KEY = os.getenv("API_KEY")

us_states_cities = {
    "Alabama": ["Birmingham", "Montgomery", "Mobile", "Huntsville"],
    "Alaska": ["Anchorage", "Fairbanks", "Juneau", "Sitka"],
    "Arizona": ["Phoenix", "Tucson", "Mesa", "Scottsdale"],
    "Arkansas": ["Little Rock", "Fayetteville", "Hot Springs", "Fort Smith"],
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento"],
    "Colorado": ["Denver", "Colorado Springs", "Aurora", "Boulder"],
    "Connecticut": ["Hartford", "New Haven", "Stamford", "Bridgeport"],
    "Delaware": ["Wilmington", "Dover", "Newark", "Middletown"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "Georgia": ["Atlanta", "Augusta", "Savannah", "Columbus"],
    "Hawaii": ["Honolulu", "Hilo", "Maui", "Kailua"],
    "Idaho": ["Boise", "Meridian", "Nampa", "Idaho Falls"],
    "Illinois": ["Chicago", "Springfield", "Peoria", "Naperville"],
    "Indiana": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"],
    "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City"],
    "Kansas": ["Topeka", "Wichita", "Overland Park", "Lawrence"],
    "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Covington"],
    "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
    "Maine": ["Portland", "Augusta", "Bangor", "Lewiston"],
    "Maryland": ["Baltimore", "Annapolis", "Silver Spring", "Frederick"],
    "Massachusetts": ["Boston", "Worcester", "Cambridge", "Springfield"],
    "Michigan": ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"],
    "Minnesota": ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
    "Mississippi": ["Jackson", "Gulfport", "Biloxi", "Hattiesburg"],
    "Missouri": ["St. Louis", "Kansas City", "Columbia", "Springfield"],
    "Montana": ["Billings", "Missoula", "Helena", "Bozeman"],
    "Nebraska": ["Omaha", "Lincoln", "Bellevue", "Grand Island"],
    "Nevada": ["Las Vegas", "Reno", "Henderson", "Carson City"],
    "New Hampshire": ["Manchester", "Concord", "Nashua", "Dover"],
    "New Jersey": ["Newark", "Jersey City", "Paterson", "Trenton"],
    "New Mexico": ["Albuquerque", "Santa Fe", "Las Cruces", "Roswell"],
    "New York": ["New York City", "Buffalo", "Rochester", "Syracuse"],
    "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham"],
    "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot"],
    "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo"],
    "Oklahoma": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"],
    "Oregon": ["Portland", "Salem", "Eugene", "Beaverton"],
    "Pennsylvania": ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown"],
    "Rhode Island": ["Providence", "Warwick", "Cranston", "Pawtucket"],
    "South Carolina": ["Columbia", "Charleston", "Greenville", "Myrtle Beach"],
    "South Dakota": ["Sioux Falls", "Pierre", "Rapid City", "Aberdeen"],
    "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Utah": ["Salt Lake City", "Provo", "West Valley City", "Ogden"],
    "Vermont": ["Montpelier", "Burlington", "Rutland", "Stowe"],
    "Virginia": ["Virginia Beach", "Richmond", "Norfolk", "Chesapeake"],
    "Washington": ["Seattle", "Spokane", "Tacoma", "Bellevue"],
    "West Virginia": ["Charleston", "Morgantown", "Huntington", "Parkersburg"],
    "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
    "Wyoming": ["Cheyenne", "Casper", "Laramie", "Gillette"],
}


def capitalize_first_letter(input_string):
    return input_string.capitalize()


def fetch_weather_data(location):
    if location in us_states_cities:
        # If a state name is provided, use the first city in the list for that state
        location = us_states_cities[location][0]

    params = {"key": API_KEY, "q": location, "aqi": "no"}
    response = requests.get(WEATHER_API_URL, params=params)
    if response.status_code == 200:
        data = response.json()
        collection.insert_one(data)
        print(f"Weather data saved for {location}:", data)
        return data
    else:
        print("Error fetching weather data:", response.status_code)
        return None


spell = SpellChecker()


def check_spelling(text):
    words = text.split()
    corrected_words = []
    for word in words:
        corrected_word = spell.correction(word)
        if corrected_word != word:
            corrected_words.append(f"{corrected_word}*")
        else:
            corrected_words.append(word)
    return " ".join(corrected_words)


@app.route("/weather-data", methods=["GET"])
def get_weather_data():
    location = request.args.get("location", "Chicago")
    # Split the location into city and state
    location_parts = location.split(",")
    city = location_parts[0].strip()
    state = location_parts[1].strip() if len(location_parts) > 1 else None

    query = {"$or": [{"location.name": city}, {"location.region": city}]}
    if state:
        query["$or"].append({"location.region": state})

    data = collection.find_one(
        query, {"_id": 0}, sort=[("location.localtime_epoch", -1)]
    )

    if data:
        processed_data = [
            {
                "timestamp": data["location"]["localtime_epoch"],
                "temperature": data["current"]["temp_c"],
                "humidity": data["current"]["humidity"],
                "location": f"{data['location']['name']}, {data['location']['region']}, {data['location']['country']}",
            }
        ]
        return jsonify(processed_data)
    else:
        return jsonify([]), 404  # Return 404 status code if no data found


@app.route("/fetch-weather", methods=["POST"])
def fetch_and_store_weather():
    data = request.json
    location = data.get("location", "Chicago")
    weather_data = fetch_weather_data(location)
    if weather_data:
        return jsonify(
            {
                "message": f"Weather data fetched and stored successfully for {weather_data['location']['name']}, {weather_data['location']['region']}, {weather_data['location']['country']}!",
                "data": {
                    "timestamp": weather_data["location"]["localtime_epoch"],
                    "temperature": weather_data["current"]["temp_c"],
                    "humidity": weather_data["current"]["humidity"],
                    "location": f"{weather_data['location']['name']}, {weather_data['location']['region']}, {weather_data['location']['country']}",
                    "wind_mph": weather_data["current"]["wind_mph"],
                    "wind_dir": weather_data["current"]["wind_dir"],
                    "condition": weather_data["current"]["condition"],
                    "last_updated": weather_data["current"]["last_updated"],
                    "pressure_mb": weather_data["current"]["pressure_mb"],
                    "feelslike_c": weather_data["current"]["feelslike_c"],
                    "dewpoint_c": weather_data["current"]["dewpoint_c"],
                    "vis_km": weather_data["current"]["vis_km"],
                },
            }
        )
    else:
        return jsonify({"error": "Failed to fetch weather data"}), 404


@app.route("/suggestions", methods=["GET"])
def get_suggestions():
    query = request.args.get("query", "").lower()
    suggestions = []

    for state, cities in us_states_cities.items():
        if query in state.lower():
            suggestions.append({"type": "state", "name": state})
        for city in cities:
            if query in city.lower():
                suggestions.append({"type": "city", "name": city, "state": state})

    return jsonify(suggestions[:10])


def extract_location(message):
    words = re.findall(r"\b[A-Za-z]+\b", message)
    for word in words:
        word = word.capitalize()
        if word in us_states_cities:  # Check if it's a state name
            return word
        for state, cities in us_states_cities.items():
            if word in cities:  # Check if it's a city name
                return word
    return None


@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.json
    user_message = data.get("message", "")

    # Apply spell checking
    corrected_message = check_spelling(user_message)

    location = extract_location(corrected_message)

    if location:
        weather_data = fetch_weather_data(location)

        if weather_data:
            context = prepare_weather_context(weather_data)

            try:
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant for weather-related queries. Use the provided weather data to answer questions accurately and concisely.",
                        },
                        {
                            "role": "user",
                            "content": f"Weather data: {context}\n\nUser query: {corrected_message}",
                        },
                    ],
                )

                bot_reply = response.choices[0].message["content"]
                return jsonify({
                    "reply": bot_reply,
                    "original_message": user_message,
                    "corrected_message": corrected_message
                })
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        else:
            return jsonify(
                {
                    "reply": f"I'm sorry, I couldn't fetch weather data for {location}. Please try again later or check if the location is spelled correctly.",
                    "original_message": user_message,
                    "corrected_message": corrected_message
                }
            )
    else:
        return jsonify(
            {
                "reply": "I'm sorry, I couldn't identify a specific location in your message. Could you please rephrase your question with a city name?",
                "original_message": user_message,
                "corrected_message": corrected_message
            }
        )


def prepare_weather_context(weather_data):
    return f"""
    Location: {weather_data["location"]["name"]}, {weather_data["location"]["region"]}, {weather_data["location"]["country"]}
    Current temperature: {weather_data["current"]["temp_c"]}°C ({weather_data["current"]["temp_f"]}°F)
    Feels like: {weather_data["current"]["feelslike_c"]}°C ({weather_data["current"]["feelslike_f"]}°F)
    Condition: {weather_data["current"]["condition"]["text"]}
    Humidity: {weather_data["current"]["humidity"]}%
    Wind: {weather_data["current"]["wind_mph"]} mph, direction {weather_data["current"]["wind_dir"]}
    Visibility: {weather_data["current"]["vis_km"]} km
    Last updated: {weather_data["current"]["last_updated"]}
    """


if __name__ == "__main__":
    app.run(debug=True)
