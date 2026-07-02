//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//high_score_display.mjs                                                //
//handles displaying high scores to a table                             //
//----------------------------------------------------------------------//


import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_Init } from "./firebase/fb_init.mjs";
import { FB_Data, FB_User } from "./firebase/fb_data.mjs";
import { FB_Login } from "./firebase/fb_login.mjs";
import { Security } from "./security.mjs";


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
        var classList = element.classList;


        //Before we read, display a 'loading' message
        element.innerHTML = "<p>Loading high scores...</p>";

        FB_IO.readOrderedByValue('gameSite/' + game + "HighScores/", "score/", async (READ)=>{

                element.innerHTML = "<tr><th>Name</th><th>Score</th></tr>"; //Start of the table
                var data = [];
                READ.forEach((USER) => {
                    //Read the name from the database using the UID
                    data.unshift(USER); //Add to the fron of the array, reversing the order (this is correct)
                });
                var idx = 0;
                for (var i = 0; i < data.length; i++) {
                    var placeClass = "";
                    if (i == 0) {
                        //First place
                        placeClass = "class='first-place'";
                    }else if (i == 1) {
                        //Second place
                        placeClass = "class='second-place'";
                    } else if (i == 2) {
                        //Third place
                        placeClass = "class='third-place'";
                    }

                    
                    const USER = data[i];
                    const VAL = USER.val();
                    const NAME = VAL.username;
                    const SCORE = VAL.score;
                    //Check security
                    if (Security.detectMaliciousText(NAME)) {
                        console.warn('malicious text in username');
                        continue;
                    }
                    if (Security.detectMaliciousText(SCORE)) {
                        console.warn('malicious text in score');
                        continue;
                    }
                    const IS_USERS_HIGH_SCORE = (USER.key == FB_User.uid); //The key is the id of the user owning the high score
                    if (IS_USERS_HIGH_SCORE) {
                        //Make the high score highlighted and bold
                        element.innerHTML += "<tr><td " + placeClass + "id='high-score-highlighted'><b>#" + (idx + 1) + ": " + NAME + "</b></td><td " + placeClass + " id='high-score-highlighted'><b>" + SCORE + " points</b></td></tr>";
                    } else if(classList.contains('#' + (idx + 1))) {
                        //Make this high score bold
                        element.innerHTML += "<tr><td " + placeClass + "><b>#" + (idx + 1) + ": " + NAME + "</b></td><td " + placeClass + "><b>" + SCORE + " points</b></td></tr>";
                    }else {
                        element.innerHTML += "<tr><td " + placeClass + ">#" + (idx + 1) + ": " + NAME + "</td><td " + placeClass + ">" + SCORE + " points</td></tr>";
                    }
                    idx++;
                }
                    
                
            },  
            true //Add this function as a listener
        );

    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //bindToHTML()
    static bindToHTML() {
        const TARGETS = document.getElementsByClassName('o-high-score-list');
        for (var i = 0; i < TARGETS.length; i++) {
            const TARGET = TARGETS[i];
            const GAME_ID = TARGET.id;
            HighScoreDisplay.displayHighScores(TARGET, GAME_ID);
        }
    }
    //----------------------------------------------------------------------//
}
//END OF HighScoreDisplay
//----------------------------------------------------------------------//



window.fb_onlogin.subscribe(()=>{console.log("HighScoreDisplay : page has loaded");
    HighScoreDisplay.bindToHTML();
    
});

    
