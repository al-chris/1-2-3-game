// ui.js - Handles all UI transitions and updates

class GameUI {
    constructor() {
        this.screens = {
            splash: document.getElementById('splash-screen'),
            username: document.getElementById('username-screen'),
            lobby: document.getElementById('lobby-screen'),
            game: document.getElementById('game-screen')
        };
        
        this.elements = {
            usernameInput: document.getElementById('username-input'),
            displayUsername: document.getElementById('display-username'),
            gameId: document.getElementById('game-id'),
            shareGameId: document.getElementById('share-game-id'),
            joinCode: document.getElementById('join-code'),
            waitingArea: document.getElementById('waiting-area'),
            countdownContainer: document.getElementById('countdown-container'),
            countdown: document.getElementById('countdown'),
            inputContainer: document.getElementById('input-container'),
            wordInput: document.getElementById('word-input'),
            timer: document.getElementById('timer'),
            resultsContainer: document.getElementById('results-container'),
            player1Name: document.getElementById('player1-name'),
            player2Name: document.getElementById('player2-name'),
            player1Score: document.getElementById('player1-score'),
            player2Score: document.getElementById('player2-score'),
            player1Word: document.getElementById('player1-word'),
            player2Word: document.getElementById('player2-word'),
            matchResult: document.getElementById('match-result'),
            roundNumber: document.getElementById('round-number')
        };
        
        this.bindBackButtons();
    }
    
    // Show a specific screen and hide others
    showScreen(screenName) {
        Object.keys(this.screens).forEach(screen => {
            this.screens[screen].classList.remove('active');
        });
        
        this.screens[screenName].classList.add('active');
    }
    
    // Bind back button functionality
    bindBackButtons() {
        document.querySelectorAll('.back-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (button.closest('#username-screen')) {
                    this.showScreen('splash');
                } else if (button.closest('#lobby-screen')) {
                    this.showScreen('username');
                }
            });
        });
    }
    
    // Display username on lobby screen
    setUsername(username) {
        this.elements.displayUsername.textContent = username;
    }
    
    // Display game ID
    setGameId(id) {
        this.elements.gameId.textContent = id;
        this.elements.shareGameId.textContent = id;
    }
    
    // Show waiting area
    showWaitingArea() {
        this.elements.waitingArea.classList.remove('hidden');
    }
    
    // Hide waiting area
    hideWaitingArea() {
        this.elements.waitingArea.classList.add('hidden');
    }
    
    // Update player names
    updatePlayerNames(player1, player2, isPlayer1) {
        this.elements.player1Name.textContent = player1;
        this.elements.player2Name.textContent = player2;
        
        // Highlight current player's name
        if (isPlayer1) {
            this.elements.player1Name.classList.add('current-player');
            this.elements.player2Name.classList.remove('current-player');
        } else {
            this.elements.player1Name.classList.remove('current-player');
            this.elements.player2Name.classList.add('current-player');
        }
    }
    
    // Update scores
    updateScores(player1Score, player2Score) {
        this.elements.player1Score.textContent = player1Score;
        this.elements.player2Score.textContent = player2Score;
    }
    
    // Update round number
    updateRound(roundNumber) {
        this.elements.roundNumber.textContent = `Round ${roundNumber}`;
    }
    
    // Show countdown
    showCountdown() {
        this.elements.countdownContainer.classList.remove('hidden');
        this.elements.inputContainer.classList.add('hidden');
        this.elements.resultsContainer.classList.add('hidden');
    }
    
    // Update countdown text
    updateCountdown(text) {
        this.elements.countdown.textContent = text;
    }
    
    // Show input area
    showInputArea() {
        this.elements.countdownContainer.classList.add('hidden');
        this.elements.inputContainer.classList.remove('hidden');
        this.elements.resultsContainer.classList.add('hidden');
        
        // Focus on input field
        this.elements.wordInput.focus();
        this.elements.wordInput.value = '';
    }
    
    // Update timer
    updateTimer(seconds) {
        this.elements.timer.textContent = seconds;
    }
    
    // Show results
    showResults(player1Word, player2Word, isMatch) {
        this.elements.countdownContainer.classList.add('hidden');
        this.elements.inputContainer.classList.add('hidden');
        this.elements.resultsContainer.classList.remove('hidden');
        
        this.elements.player1Word.textContent = player1Word;
        this.elements.player2Word.textContent = player2Word;
        
        if (isMatch) {
            this.elements.matchResult.textContent = 'MATCH! 🎉';
            this.elements.matchResult.classList.add('match');
            this.elements.matchResult.classList.remove('no-match');
        } else {
            this.elements.matchResult.textContent = 'Keep trying!';
            this.elements.matchResult.classList.add('no-match');
            this.elements.matchResult.classList.remove('match');
        }
    }
}