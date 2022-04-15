/**
 * This function will query the CS4640 server for a new word.
 *
 * It makes use of AJAX and Promises to await the result.
 */

//flag to check if game in progress
let GAMEINPROGRESS = false;
let GUESSANSWER;
let REGEX = /^[a-zA-Z]+$/


//init text variables
let gamesPlayedText = "Number of games played ";
let wonText = "Number of games won ";
let streakText = "Win Streak ";
let avgText = "Average Number of Guesses per game ";
let currGuessText = "Current Number of Guesses "


//init dom variables
let gamesPlayedElmnt;
let wonElmnt;
let streakElmnt;
let avgElmnt;
let guessInput;
let guessSubmit;
let clearStats;
let guessList;
let currGuess;

//init storage variables
let prevGuesses = [];
let gamesPlayed = 0;
let gamesWon = 0;
let winStreak = 0;
let avgGuesses = 0;
let numGuesses = 0;

/* <p id="games-played"></p>
<p id="games-won"></p>
<p id="win-streak"></p>
<p id="avg-guesses"></p> */

function initStorage(){
    if(localStorage.getItem("gameInProgress") === null){
        localStorage.setItem("gamesPlayed", 0);
        localStorage.setItem("gamesWon", 0);
        localStorage.setItem("winStreak", 0);
        localStorage.setItem("avgGuesses", 0);
        localStorage.setItem("gameInProgress", 0)
        localStorage.setItem("numGuesses", 0)
    }else{
        gamesPlayed = parseInt(localStorage.getItem("gamesPlayed"));
        gamesWon = parseInt(localStorage.getItem("gamesWon"));
        winStreak = parseInt(localStorage.getItem("winStreak"));
        avgGuesses = parseInt(localStorage.getItem("avgGuesses"));
        GAMEINPROGRESS = (localStorage.getItem("gameInProgress") == 1) ? true : false;
        prevGuesses = (JSON.parse(localStorage.getItem("prevGuesses"))!== null) ? JSON.parse(localStorage.getItem("prevGuesses")) : [];
        numGuesses = parseInt(localStorage.getItem("numGuesses"));
        GUESSANSWER = GAMEINPROGRESS ? localStorage.getItem("guessAnswer") : "";
    }
    return;
}


function initPage(){
    //init local storage
    initStorage();
    //set dom variables
    gamesPlayedElmnt = document.getElementById("games-played");
    wonElmnt = document.getElementById("games-won");
    streakElmnt = document.getElementById("win-streak");
    avgElmnt = document.getElementById("avg-guesses");
    guessInput = document.getElementById("guess-input");
    guessSubmit = document.getElementById("guess-submit");
    guessList = document.getElementById("guess-list");
    currGuess = document.getElementById("num-guesses");

    gamesPlayedElmnt.textContent = gamesPlayedText + gamesPlayed;
    wonElmnt.textContent = wonText + gamesWon;
    streakElmnt.textContent = streakText + winStreak;
    avgElmnt.textContent = avgText + avgGuesses;
    currGuess.textContent = currGuessText + numGuesses;
    if(GAMEINPROGRESS){
        printPriorGuesses();
        guessInput.removeAttribute("disabled");
        guessSubmit.removeAttribute("disabled");
        if(localStorage.getItem("numChar")){
            renderLi("guess-results", "Number of Characters in the word: ",localStorage.getItem("numChar"));
            renderLi("guess-results", "Number of Characters in the correct location: ", localStorage.getItem("sameLoc"));
            renderLi("guess-results", localStorage.getItem("lenResult"));
        }
    }

}


function printPriorGuesses(){
    guessList = document.getElementById("guess-list");
    prevGuesses.forEach((guess)=>{
        let li = document.createElement("li");
        li.innerText = guess;
        guessList.appendChild(li);
    })
}

function calcAvg(){
    avgGuesses = parseInt((numGuesses + (gamesPlayed * avgGuesses))/(gamesPlayed + 1));
    localStorage.setItem("avgGuesses", avgGuesses);
    avgElmnt.textContent = avgText + avgGuesses;
}

//update the game statistics to clear the win streak and the average number of guesses per game.
//clear text box
//clear prior guesses 
function newGameHandler(newWord){
    clearResultDeets();
    document.getElementById("guess-results").innerHTML = "";
    guessList.innerHTML = "";
    if(GAMEINPROGRESS){  
        calcAvg();
        //update variables
        gamesPlayed++;
        winStreak = 0;
        localStorage.setItem("gamesPlayed", gamesPlayed);
        guessInput.value = "";
        GUESSANSWER = newWord;
        localStorage.setItem("guessAnswer", GUESSANSWER);
        guessInput.removeAttribute("disabled");
        guessSubmit.removeAttribute("disabled");
        //update display
        gamesPlayedElmnt.textContent = gamesPlayedText + gamesPlayed;

    }else {
        GAMEINPROGRESS = true;
        //update local storage
        localStorage.setItem("gameInProgress", 1)
        guessInput.removeAttribute("disabled");
        guessSubmit.removeAttribute("disabled");
        GUESSANSWER = newWord;
        localStorage.setItem("guessAnswer", GUESSANSWER);
    }
}

function guessHandler(){
    //handle variables
    let currentGuess = guessInput.value.toLowerCase();
    if(!REGEX.test(currentGuess)){
        alert("No special characters or numbers");
        return;
    }
    document.getElementById("guess-results").innerHTML = "";
    numGuesses++;
    localStorage.setItem("numGuesses", numGuesses);
    currGuess.textContent = currGuessText + numGuesses;

    //append item to list
    prevGuesses.push(currentGuess);
    let li = document.createElement("li");
    li.innerText = currentGuess;
    guessList.appendChild(li);

    //update local storage
    localStorage.setItem("prevGuesses", JSON.stringify(prevGuesses));

    guessInput.value = ""

    //start checking 
    checkAnswer(currentGuess);

    return;

}

function renderLi(elementName, ...data){
    let  elmnt = document.getElementById(elementName);
    let li = document.createElement("li");
    li.innerText = "";
    data.forEach((datum) => {
        li.innerText = li.innerText + datum
    })
    elmnt.appendChild(li);
}

function clearResultDeets(){
    localStorage.removeItem("numChar");
    localStorage.removeItem("lenResult");
    localStorage.removeItem("sameLoc");
}


function checkAnswer(guess){
    if(guess === GUESSANSWER){
        gamesWon++;
        localStorage.setItem("gamesWon", gamesWon);
        wonElmnt.textContent = wonText + gamesWon;
        calcAvg();
        gamesPlayed++;
        localStorage.setItem("gamesPlayer", gamesPlayed);
        resetGame();
        winStreak++;
        localStorage.setItem("winStreak", winStreak);
        return;
    }else{
        let ansLen = GUESSANSWER.length;
        let guessLen = guess.length;
        let guessFreq = new Array(26).fill(0);
        let ansFreq = new Array(26).fill(0);
        let commonCharCount = 0;
        let sameLocCount = 0;
        for(let i = 0; i < guessLen; i++){
            guessFreq[guess[i].charCodeAt() - 97]++;
        }
        for(let i = 0; i < ansLen; i++){
            ansFreq[GUESSANSWER[i].charCodeAt() - 97]++;
        }
        for(let i = 0; i < 26; i++){
            commonCharCount += Math.min(guessFreq[i], ansFreq[i]);
        }

        for(let i = 0; i < ansLen; i++){
            if(i >= ansLen || i >= guessLen){
                break;
            }
            if(guess[i] === GUESSANSWER[i]){
                sameLocCount++;
            }
        }

        //render info
        renderLi("guess-results", "Number of Characters in the word: ", commonCharCount);
        localStorage.setItem("numChar", commonCharCount);
        renderLi("guess-results", "Number of Characters in the correct location: ", sameLocCount);
        localStorage.setItem("sameLoc", sameLocCount);
        if(guessLen < ansLen){
            renderLi("guess-results", "Too short"); 
            localStorage.setItem("lenResult", "Too short");
        }else if(guessLen > ansLen){
            renderLi("guess-results", "Too long");
            localStorage.setItem("lenResult", "Too long");
        }else{
            renderLi("guess-results", "The guess and the answer are the same length");
            localStorage.setItem("lenResult", "The guess and the answer are the same length");
        }

        return;
    }
}

function resetGame(){
    numGuesses = 0;
    localStorage.setItem("numGuesses", 0);
    guessInput.setAttribute("disabled", "");
    guessSubmit.setAttribute("disabled", "");
    prevGuesses = [];
    localStorage.removeItem("prevGuesses");
    guessList.innerHTML = "";
    localStorage.removeItem("guessAnswer");
    GAMEINPROGRESS = false;
    localStorage.setItem("gameInProgress", 0);
    currGuess.textContent = currGuessText + numGuesses;


    return;
    
}


function clearHandler(){
    localStorage.clear();
    guessList.innerHTML = "";
    prevGuesses = [];
    gamesPlayed = 0;
    gamesWon = 0;
    winStreak = 0;
    avgGuesses = 0;
    GAMEINPROGRESS = false;
    numGuesses = 0
    initPage();
    getRandomWord(newGameHandler);
    return;
}


function queryWord() {
    return new Promise( resolve => {
            // instantiate the object
            var ajax = new XMLHttpRequest();
            // open the request
            ajax.open("GET", "https://cs4640.cs.virginia.edu/api/wordleword.php", true);
            // ask for a specific response
            ajax.responseType = "text";
            // send the request
            ajax.send(null);
            
            // What happens if the load succeeds
            ajax.addEventListener("load", function() {
                // Return the word as the fulfillment of the promise 
                if (this.status == 200) { // worked 
                    resolve(this.response);
                } else {
                    console.log("When trying to get a new word, the server returned an HTTP error code.");
                }
            });
            
            // What happens on error
            ajax.addEventListener("error", function() {
                console.log("When trying to get a new word, the connection to the server failed.");
            });
    });
}

/**
 * This is the function you should call to request a new word.
 * It takes one parameter: a callback function.  This function
 * should take one parameter (the new word) and handle the setup
 * of your new game.  For example if you have a function named
 * setUpNewGame(newWord), then in your event handler for a new
 * game, you should call this function as:
 *     getRandomWord(setUpNewGame);
 * It will wait for the server to provide a new word, then it will
 * call your function, passing in the word, to continue setting up
 * the new game.
 */
async function getRandomWord(callback) {
    var newWord = await queryWord();
    callback(newWord);
}
