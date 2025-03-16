// game.js - Handles core game logic and socket communication

class Game {
    constructor(ui) {
        this.ui = ui;
        this.socket = null;
        this.username = '';
        this.gameId = '';
        this.isPlayer1 = false;
        this.currentRound = 1;
        this.scores = {
            player1: 0,
            player2: 0
        };
        this.wordSubmitted = false;
        this.playAgainSubmitted = false;
        
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        // Connect to FastAPI WebSocket endpoint
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        // Connection opened
        this.socket.onopen = () => {
            console.log('Connected to server');
        };
        
        // Listen for messages
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerEvent(data.event, data.payload);
        };
        
        // Connection closed
        this.socket.onclose = () => {
            console.log('Disconnected from server');
            // Attempt to reconnect after delay
            setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        // Connection error
        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }
    
    // Send event to server
    sendToServer(event, payload = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const data = {
                event: event,
                payload: payload
            };
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
        }
    }
    
    // Handle events from server
    handleServerEvent(event, payload) {
        console.log(`Received ${event} event:`, payload);
        
        switch (event) {
            case 'gameCreated':
                this.gameId = payload.gameId;
                this.isPlayer1 = true;
                
                this.ui.setGameId(this.gameId);
                this.ui.showWaitingArea();
                break;
                
            case 'playerJoined':
                // Start the game when both players are ready
                this.ui.showScreen('game');
                this.ui.updatePlayerNames(payload.player1, payload.player2, this.isPlayer1);
                this.ui.updateRound(this.currentRound);
                this.startRound();
                break;
                
            case 'gameNotFound':
                alert('Game not found. Please check the game ID and try again.');
                break;
                
            case 'gameFull':
                alert('This game is already full. Please create a new game or join another one.');
                break;
                
            case 'countdown':
                this.ui.updateCountdown(payload.count);
                break;
                
            case 'roundStart':
                this.wordSubmitted = false;
                this.ui.showInputArea();
                this.startInputTimer();
                break;
                
            case 'roundResults':
                const { player1Word, player2Word, isMatch, player1Score, player2Score } = payload;
                
                // Update UI with round results
                this.ui.showResults(player1Word, player2Word, isMatch);
                this.ui.updateScores(player1Score, player2Score);
                
                // Update game state
                this.scores.player1 = player1Score;
                this.scores.player2 = player2Score;
                
                // If there's a match, show play again option
                if (isMatch) {
                    setTimeout(() => {
                        this.playAgainSubmitted = false; // Reset for new play again decision
                        this.ui.showPlayAgainDialog();
                    }, 3000);
                } else {
                    // Otherwise, prepare for next round after a delay
                    setTimeout(() => {
                        this.currentRound++;
                        this.ui.updateRound(this.currentRound);
                        this.startRound();
                    }, 3000);
                }
                break;
                
            case 'waitingForOtherPlayer':
                this.ui.showWaitingForOtherPlayer();
                break;
                
            case 'newGameStarting':
                // Reset for new game
                this.currentRound = 1;
                this.ui.updateRound(this.currentRound);
                this.ui.updateScores(payload.player1Score, payload.player2Score);
                this.ui.hidePlayAgainDialog();
                this.playAgainSubmitted = false;
                // The server will start the next countdown automatically
                break;
                
            case 'gameEnded':
                alert('Game ended: ' + payload.message);
                this.resetGame();
                this.ui.showScreen('lobby');
                break;
                
            case 'playerDisconnected':
                alert('The other player has disconnected. You will be returned to the lobby.');
                this.resetGame();
                this.ui.showScreen('lobby');
                break;
                
            case 'gameError':
                alert(`Game error: ${payload.message}`);
                break;
                
            default:
                console.warn(`Unknown event received: ${event}`);
        }
    }
    
    setUsername(username) {
        this.username = username;
        this.ui.setUsername(username);
    }
    
    createGame() {
        this.sendToServer('createGame', { username: this.username });
    }
    
    joinGame(gameId) {
        this.gameId = gameId;
        this.isPlayer1 = false;
        this.sendToServer('joinGame', { gameId, username: this.username });
    }
    
    startRound() {
        this.ui.showCountdown();
        this.sendToServer('readyForRound', { gameId: this.gameId });
    }
    
    submitWord(word) {
        if (!this.wordSubmitted) {
            this.wordSubmitted = true;
            this.sendToServer('submitWord', { gameId: this.gameId, word: word });
        }
    }
    
    startInputTimer() {
        let seconds = 5;
        this.ui.updateTimer(seconds);
        
        const timerInterval = setInterval(() => {
            seconds--;
            this.ui.updateTimer(seconds);
            
            if (seconds <= 0) {
                clearInterval(timerInterval);
                // Auto-submit blank if no word entered
                if (!this.wordSubmitted) {
                    this.submitWord(this.ui.elements.wordInput.value || '...');
                }
            }
        }, 1000);
    }
    
    // New method to handle play again choice
    choosePlayAgain(playAgain) {
        if (!this.playAgainSubmitted) {
            this.playAgainSubmitted = true;
            this.sendToServer('playAgainChoice', { 
                gameId: this.gameId, 
                playAgain: playAgain 
            });
        }
    }
    
    leaveGame() {
        this.sendToServer('leaveGame', { gameId: this.gameId });
        this.resetGame();
    }
    
    resetGame() {
        this.gameId = '';
        this.currentRound = 1;
        this.scores = { player1: 0, player2: 0 };
        this.wordSubmitted = false;
        this.playAgainSubmitted = false;
    }
}