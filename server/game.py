# game.py - Game management module

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class Game:
    id: str
    player1_id: str
    player1_name: str
    player2_id: Optional[str] = None
    player2_name: Optional[str] = None
    player1_score: int = 0
    player2_score: int = 0
    player1_ready: bool = False
    player2_ready: bool = False
    player1_word: Optional[str] = None
    player2_word: Optional[str] = None
    round: int = 1
    status: str = "waiting"  # waiting, active, completed
    # New fields for handling play-again logic
    match_found: bool = False
    player1_play_again: Optional[bool] = None  # Changed to None as default
    player2_play_again: Optional[bool] = None  # Changed to None as default


class GameManager:
    def __init__(self):
        # Store active games
        self.games: Dict[str, Game] = {}
    
    # Create a new game
    def create_game(self, game_id: str, player_id: str, player_name: str) -> Game:
        game = Game(
            id=game_id,
            player1_id=player_id,
            player1_name=player_name
        )
        self.games[game_id] = game
        return game
    
    # Get game by ID
    def get_game(self, game_id: str) -> Optional[Game]:
        return self.games.get(game_id)
    
    # Add second player to game
    def join_game(self, game_id: str, player_id: str, player_name: str) -> bool:
        game = self.games.get(game_id)
        
        if game and not game.player2_id:
            game.player2_id = player_id
            game.player2_name = player_name
            game.status = "active"
            return True
        
        return False
    
    # Reset game state for a new round
    def reset_round_state(self, game_id: str) -> bool:
        game = self.games.get(game_id)
        
        if game:
            game.player1_ready = False
            game.player2_ready = False
            game.player1_word = None
            game.player2_word = None
            return True
        
        return False
    
    # Reset for a new game after match
    def reset_for_new_game(self, game_id: str) -> bool:
        game = self.games.get(game_id)
        
        if game:
            game.player1_ready = False
            game.player2_ready = False
            game.player1_word = None
            game.player2_word = None
            game.match_found = False
            game.player1_play_again = None  # Reset to None
            game.player2_play_again = None  # Reset to None
            game.round = 1
            # Keep scores for continuing players
            return True
        
        return False
    
    # Mark player's play-again choice
    def player_play_again(self, game_id: str, player_id: str, play_again: bool) -> dict:
        game = self.games.get(game_id)
        
        if not game:
            return {"success": False, "message": "Game not found"}
        
        # Set the player's choice
        if player_id == game.player1_id:
            game.player1_play_again = play_again
        elif player_id == game.player2_id:
            game.player2_play_again = play_again
        else:
            return {"success": False, "message": "Player not in this game"}
        
        # If either player chooses not to play again, end the game
        if play_again is False:
            return {"success": True, "continue": False}
        
        # If both players have made a choice and both want to play again
        if game.player1_play_again is not None and game.player2_play_again is not None:
            if game.player1_play_again and game.player2_play_again:
                self.reset_for_new_game(game_id)
                return {"success": True, "continue": True}
            else:
                return {"success": True, "continue": False}
        
        # Still waiting for the other player
        return {"success": True, "waiting": True}
    
    # Remove player from game
    def remove_player(self, game_id: str, player_id: str) -> bool:
        game = self.games.get(game_id)
        
        if not game:
            return False
        
        # Check which player is leaving
        if game.player1_id == player_id:
            # If it's player 1, delete the game since they're the host
            del self.games[game_id]
            return True
        elif game.player2_id == player_id:
            # If it's player 2, just remove them and set game status back to waiting
            game.player2_id = None
            game.player2_name = None
            game.status = "waiting"
            return True
        
        return False
    
    # Find all games a player is in
    def find_player_games(self, player_id: str) -> List[str]:
        player_games = []
        
        for game_id, game in self.games.items():
            if game.player1_id == player_id or game.player2_id == player_id:
                player_games.append(game_id)
        
        return player_games
    
    # Clean up completed or stale games
    def cleanup_games(self) -> None:
        # This would be called by a scheduled task in a production environment
        stale_games = []
        
        for game_id, game in self.games.items():
            if game.status == "completed":
                stale_games.append(game_id)
        
        for game_id in stale_games:
            del self.games[game_id]