# main.py - Main FastAPI server file

import uuid
from typing import Dict, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import asyncio
from pathlib import Path
from game import GameManager

# Initialize FastAPI and GameManager
app = FastAPI()
game_manager = GameManager()

# Define the path to the client directory
client_dir = Path(__file__).parent.parent / "client"

# Mount the client directory to serve static files
app.mount("/assets", StaticFiles(directory=client_dir / "assets"), name="assets")

# Store active WebSocket connections
connected_clients: Dict[str, WebSocket] = {}

# Serve the main HTML file
@app.get("/")
async def read_index():
    return FileResponse(client_dir / "index.html")

# WebSocket endpoint for game connections
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket
    
    try:
        while True:
            # Receive message from client
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            event = data.get("event")
            payload = data.get("payload", {})
            
            # Handle different events
            if event == "createGame":
                await handle_create_game(client_id, payload)
            elif event == "joinGame":
                await handle_join_game(client_id, payload)
            elif event == "readyForRound":
                await handle_ready_for_round(client_id, payload)
            elif event == "submitWord":
                await handle_submit_word(client_id, payload)
            elif event == "playAgainChoice":
                await handle_play_again_choice(client_id, payload)
            elif event == "leaveGame":
                await handle_leave_game(client_id, payload)
    
    except WebSocketDisconnect:
        # Remove client from connected clients
        if client_id in connected_clients:
            del connected_clients[client_id]
            
        # Find any games this player is in
        games = game_manager.find_player_games(client_id)
        
        # Notify other players and clean up games
        for game_id in games:
            await notify_game_room(game_id, "playerDisconnected", {}, exclude_client=client_id)
            game_manager.remove_player(game_id, client_id)


# Event handlers
async def handle_create_game(client_id: str, payload: dict):
    username = payload.get("username", "Player")
    game_id = str(uuid.uuid4())[:6]  # Shorter, user-friendly ID
    
    # Create game in game manager
    game_manager.create_game(game_id, client_id, username)
    
    # Send game created event to client
    await send_to_client(client_id, "gameCreated", {"gameId": game_id})
    
    print(f"Game created: {game_id} by {username}")


async def handle_join_game(client_id: str, payload: dict):
    game_id = payload.get("gameId")
    username = payload.get("username", "Player")
    
    # Get game from game manager
    game = game_manager.get_game(game_id)
    
    # Check if game exists
    if not game:
        await send_to_client(client_id, "gameNotFound", {})
        return
    
    # Check if game already has two players
    if game.player2_id:
        await send_to_client(client_id, "gameFull", {})
        return
    
    # Add second player to game
    game_manager.join_game(game_id, client_id, username)
    
    # Get updated game data
    updated_game = game_manager.get_game(game_id)
    
    # Notify both players that the game is ready to start
    await notify_game_room(game_id, "playerJoined", {
        "player1": updated_game.player1_name,
        "player2": updated_game.player2_name
    })
    
    print(f"Player {username} joined game {game_id}")


async def handle_ready_for_round(client_id: str, payload: dict):
    game_id = payload.get("gameId")
    game = game_manager.get_game(game_id)
    
    if not game:
        return
    
    # Mark this player as ready
    if client_id == game.player1_id:
        game.player1_ready = True
    elif client_id == game.player2_id:
        game.player2_ready = True
    
    # If both players are ready, start the countdown
    if game.player1_ready and game.player2_ready:
        game_manager.reset_round_state(game_id)
        await start_countdown(game_id)


async def handle_submit_word(client_id: str, payload: dict):
    game_id = payload.get("gameId")
    word = payload.get("word", "")
    game = game_manager.get_game(game_id)
    
    if not game:
        return
    
    # Store the player's word
    if client_id == game.player1_id:
        game.player1_word = word
    elif client_id == game.player2_id:
        game.player2_word = word
    
    # Check if both players have submitted words
    if game.player1_word and game.player2_word:
        # Check if the words match
        is_match = game.player1_word.lower() == game.player2_word.lower()
        
        # Update scores if there's a match
        if is_match:
            game.player1_score += 1
            game.player2_score += 1
            game.match_found = True  # Mark that we found a match
        
        # Send results to both players
        await notify_game_room(game_id, "roundResults", {
            "player1Word": game.player1_word,
            "player2Word": game.player2_word,
            "isMatch": is_match,
            "player1Score": game.player1_score,
            "player2Score": game.player2_score
        })


async def handle_play_again_choice(client_id: str, payload: dict):
    game_id = payload.get("gameId")
    play_again = payload.get("playAgain", False)
    
    print(f"Player {client_id} chose {'to play again' if play_again else 'not to play again'} for game {game_id}")
    
    result = game_manager.player_play_again(game_id, client_id, play_again)
    
    if not result["success"]:
        await send_to_client(client_id, "gameError", {"message": result.get("message", "Unknown error")})
        return
    
    # If either player chooses not to play again, end the game
    if "continue" in result and result["continue"] is False:
        await notify_game_room(game_id, "gameEnded", {
            "message": "Game ended - a player chose not to continue"
        })
        return
    
    # If both players want to continue, start a new game
    if "continue" in result and result["continue"] is True:
        game = game_manager.get_game(game_id)
        await notify_game_room(game_id, "newGameStarting", {
            "player1": game.player1_name,
            "player2": game.player2_name,
            "player1Score": game.player1_score,
            "player2Score": game.player2_score,
            "round": game.round
        })
        
        # Give players a moment before starting the new game
        await asyncio.sleep(2)
        await start_countdown(game_id)
    
    # If we're still waiting for other player, notify this player
    if "waiting" in result and result["waiting"] is True:
        await send_to_client(client_id, "waitingForOtherPlayer", {})


async def handle_leave_game(client_id: str, payload: dict):
    game_id = payload.get("gameId")
    
    if game_id:
        # Remove player from game
        game_manager.remove_player(game_id, client_id)
        
        # Notify other player
        await notify_game_room(game_id, "playerDisconnected", {}, exclude_client=client_id)
        
        print(f"Player left game {game_id}")


# Helper functions
async def send_to_client(client_id: str, event: str, data: dict):
    """Send event to a specific client"""
    if client_id in connected_clients:
        websocket = connected_clients[client_id]
        message = {
            "event": event,
            "payload": data
        }
        await websocket.send_text(json.dumps(message))


async def notify_game_room(game_id: str, event: str, data: dict, exclude_client: Optional[str] = None):
    """Send event to all players in a game"""
    game = game_manager.get_game(game_id)
    
    if not game:
        return
    
    # Send to player 1 if not excluded
    if game.player1_id and game.player1_id != exclude_client:
        await send_to_client(game.player1_id, event, data)
    
    # Send to player 2 if not excluded
    if game.player2_id and game.player2_id != exclude_client:
        await send_to_client(game.player2_id, event, data)


async def start_countdown(game_id: str):
    """Start game countdown"""
    # Send initial countdown
    await notify_game_room(game_id, "countdown", {"count": "Ready?"})
    
    # Start countdown timer
    for count in range(3, 0, -1):
        await asyncio.sleep(1)
        await notify_game_room(game_id, "countdown", {"count": str(count)})
    
    # Send GO! message
    await asyncio.sleep(1)
    await notify_game_room(game_id, "countdown", {"count": "GO!"})
    
    # Give players a moment to see "GO!" before showing input
    await asyncio.sleep(0.5)
    await notify_game_room(game_id, "roundStart", {})


# Run the app with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)