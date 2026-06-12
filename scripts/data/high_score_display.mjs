//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//high_score_display.mjs                                                //
//handles displaying high scores to a table                             //
//----------------------------------------------------------------------//


import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_Init } from "./firebase/fb_init.mjs";
import { FB_Data, FB_User } from "./firebase/fb_data.mjs";
import { FB_Login } from "./firebase/fb_login.mjs";


//----------------------------------------------------------------------//
//HighScoreDisplay class - handles displaying high score lists
export class HighScoreDisplay {
    //----------------------------------------------------------------------//
    //displayHighScores(game)
    //game: which game to get high scores from
    //CANT USE CLIENT SIDE SORT - MUST USE FIREBASE
    static async displayHighScores(target, game) {
        console.log("HighScoreDisplay::displayHighScores(game): game = '" + game + "'");
        
        var element = target;

        //Before we read, display a 'loading' message
        element.innerHTML = "<p>Loading high scores...</p>";

        FB_IO.readOrderedByValue('gameSite/' + game + "HighScores/", "score/", async (READ)=>{

                element.innerHTML = "<tr><th>Name</th><th>Score</th></tr>"; //Start of the table
                var data = [];
                READ.forEach((USER) => {
                    //Read the name from the database using the UID
                    data.unshift(USER); //Add to the fron of the array, reversing the order (this is correct)
                });
                for (var i = 0; i < data.length; i++) {
                    const USER = data[i];
                    const VAL = USER.val();
                    const NAME = VAL.username;
                    const SCORE = VAL.score;
                    const IS_USERS_HIGH_SCORE = (USER.key == FB_User.uid); //The key is the id of the user owning the high score
                    if (IS_USERS_HIGH_SCORE) {
                        //Make the high score highlighted and bold
                        element.innerHTML += "<tr><td id='high-score-highlighted'><b>" + NAME + "</b></td><td id='high-score-highlighted'><b>" + SCORE + " points</b></td></tr>";
                    } else {
                        element.innerHTML += "<tr><td>" + NAME + "</td><td>" + SCORE + " points</td></tr>";
                    }
                }
                    
                
            },  
            true //Add this function as a listener
        );

    }
    //----------------------------------------------------------------------//
}
//END OF HighScoreDisplay
//----------------------------------------------------------------------//



window.onLogin = ()=>{console.log("HighScoreDisplay : page has loaded");
    const TARGETS = document.getElementsByClassName('o-high-score-list');
    for (var i = 0; i < TARGETS.length; i++) {
        const TARGET = TARGETS[i];
        const GAME_ID = TARGET.id;
        HighScoreDisplay.displayHighScores(TARGET, GAME_ID);
    }
    
}

    
