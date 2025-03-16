# 1-2-3 Word Game

A multiplayer word game where two players try to find a common ground between their words. Built with FastAPI backend and vanilla JavaScript frontend.

## Game Overview

1. Two players join a game session.
2. A countdown appears (3...2...1...GO!).
3. Both players type a word simultaneously.
4. Words are revealed only after both players have submitted.
5. Players continue by typing words they think connect their previously submitted words.
6. The game continues until both players submit the same word.

## Features

- Real-time multiplayer gameplay
- Mobile responsive design
- Countdown timer
- Time-limited word input
- Score tracking
- Game ID sharing for easy joining

## Project Structure

```
1-2-3-game/
├── client/         # Frontend static files
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       ├── app.js
│   │       ├── game.js
│   │       └── ui.js
│   └── index.html
├── server/         # FastAPI backend
│   ├── main.py     # Main FastAPI application
│   ├── game.py     # Game management
│   └── requirements.txt
└── README.md
```

## Installation

### Requirements

- Python 3.7+
- Modern web browser

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd 1-2-3-game
   ```

2. Install backend dependencies:
   ```
   cd server
   pip install -r requirements.txt
   ```

3. Run the FastAPI server:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. Access the game:
   Open your browser and navigate to `http://localhost:8000`

## How to Play

1. On the home screen, click "Casual Mode"
2. Enter a username and continue
3. Create a new game or join an existing one with a game ID
4. If creating a game, share the game ID with a friend
5. Once both players join, the game begins with a countdown
6. Type your word when prompted and hit Enter
7. See both words after submission
8. Continue until you both type the same word

## Deployment

### Deploying to Heroku

1. Create a Procfile in the project root:
   ```
   web: cd server && uvicorn main:app --host=0.0.0.0 --port=${PORT}
   ```

2. Create a runtime.txt:
   ```
   python-3.9.7
   ```

3. Create a requirements.txt in the project root:
   ```
   -r server/requirements.txt
   ```

4. Deploy to Heroku:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   heroku create
   git push heroku main
   ```

### Deploying to DigitalOcean App Platform

1. Create a new app on DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure the build command: `pip install -r server/requirements.txt`
4. Configure the run command: `cd server && uvicorn main:app --host=0.0.0.0 --port=$PORT`
5. Deploy your app

## Future Enhancements

- Persistent user accounts and statistics
- Voice input mode
- Ranked matchmaking
- Themed word categories
- Time attack mode (decreasing time limits)
- Multi-language support

## License

[MIT License](LICENSE)