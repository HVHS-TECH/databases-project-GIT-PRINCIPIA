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
    static async displayHighScores(game) {
        console.log("HighScoreDisplay::displayHighScores(game): game = '" + game + "'");
        const ID = "o-" + game + "-high-score-list";
        
        var element = document.getElementById(ID);

        //Before we read, display a 'loading' message
        element.innerHTML = "<p>Loading high scores...</p>";

        FB_IO.readOrderedByValue('gameSite/' + game + "HighScores/", "score/", async (READ)=>{

            element.innerHTML = "<tr><th>Name</th><th>Score</th></tr>"; //Start of the table
            
            READ.forEach(async (USER) => {
                //Read the name from the database using the UID
                const VAL = USER.val();
                const NAME = VAL.username;
                const SCORE = VAL.score;
                console.log(USER.key);
                console.log(USER.uid);
                const IS_USERS_HIGH_SCORE = (USER.key == FB_User.uid);
                const ID = IS_USERS_HIGH_SCORE ? " id='high-score-of-user'" : "";
                element.innerHTML += "<tr><td" + ID + ">" + NAME + ":</td><td" + ID + ">" + SCORE + " points</td></tr>";
            });
                
            
        }, true);

    }
    //----------------------------------------------------------------------//
}
//END OF HighScoreDisplay
//----------------------------------------------------------------------//

FB_Init.init();


addEventListener("load", async ()=>{
    FB_Login.login(()=>{console.log("HighScoreDisplay : page has loaded");
        const ASTRO_EXPLORER = document.getElementById('o-astroExplorer-high-score-list');
        const GEO_DASH = document.getElementById('o-geoDash-high-score-list');

        if (ASTRO_EXPLORER) {HighScoreDisplay.displayHighScores("astroExplorer");} 
        if (GEO_DASH) {HighScoreDisplay.displayHighScores("geoDash");}
    });
    
});