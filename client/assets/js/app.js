// app.js - Main entry point that initializes the game

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI and Game
    const ui = new GameUI();
    const game = new Game(ui);
    
    // Splash Screen - Casual Mode Button
    document.getElementById('casual-btn').addEventListener('click', () => {
        ui.showScreen('username');
    });
    
    // Username Screen - Submit Button
    document.getElementById('username-submit').addEventListener('click', () => {
        const username = ui.elements.usernameInput.value.trim();
        if (username) {
            game.setUsername(username);
            ui.showScreen('lobby');
        } else {
            alert('Please enter a username');
        }
    });
    
    // Lobby Screen - Create Game Button
    document.getElementById('create-game').addEventListener('click', () => {
        game.createGame();
    });
    
    // Lobby Screen - Join Game Button
    document.getElementById('join-game').addEventListener('click', () => {
        const gameId = ui.elements.joinCode.value.trim();
        if (gameId) {
            game.joinGame(gameId);
        } else {
            alert('Please enter a game ID');
        }
    });
    
    // Lobby Screen - Cancel Game Button
    document.getElementById('cancel-game').addEventListener('click', () => {
        game.leaveGame();
        ui.hideWaitingArea();
    });
    
    // Game Screen - Leave Game Button
    document.getElementById('leave-game').addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the game?')) {
            game.leaveGame();
            ui.showScreen('lobby');
        }
    });
    
    // Word Input - Submit on Enter Key
    ui.elements.wordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const word = ui.elements.wordInput.value.trim();
            if (word) {
                game.submitWord(word);
            }
        }
    });
    
    // Setup play again button listeners
    setupPlayAgainButtons(ui, game);
    
    // Show the splash screen initially
    ui.showScreen('splash');
});

// Separate function to set up play again buttons
// This helps with organization and potential reuse
function setupPlayAgainButtons(ui, game) {
    // Play Again - Yes Button
    ui.elements.playAgainYesBtn.addEventListener('click', () => {
        console.log("Yes button clicked");
        game.choosePlayAgain(true);
    });
    
    // Play Again - No Button
    ui.elements.playAgainNoBtn.addEventListener('click', () => {
        console.log("No button clicked");
        game.choosePlayAgain(false);
    });
}