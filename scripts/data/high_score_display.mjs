//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//high_score_display.mjs                                                //
//handles displaying high scores to a table                             //
//----------------------------------------------------------------------//


import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_Init } from "./firebase/fb_init.mjs";
import { FB_Data } from "./firebase/fb_data.mjs";


//----------------------------------------------------------------------//
//HighScoreDisplay class - handles displaying high score lists
export class HighScoreDisplay {
    //----------------------------------------------------------------------//
    //displayHighScores(game)
    //game: which game to get high scores from
    //CANT USE CLIENT SIDE SORT - MUST USE FIREBASE
    static async displayHighScores(game) {
        const ID = "o-" + game + "-high-score-list";
        
        var element = document.getElementById(ID);

        //Before we read, display a 'loading' message
        element.innerHTML = "<p>Loading high scores...</p>";

        FB_IO.readOrderedByValue('gameSite/' + game + "HighScores/", "score/", async (READ)=>{

            //RESEARCH READORDEREDBYVALUE USING CHILDREN OF THE NODE AS THE SORTING VALUES
            //USE THE ".onValue" VARIABLE?
    
            element.innerHTML = "<tr><th>Name</th><th>Score</th></tr>"; //Start of the table
            
            READ.forEach(async (USER) => {
                //Read the name from the database using the UID
                const VAL = USER.val();
                const NAME = VAL.username;
                const SCORE = VAL.score;
    
                element.innerHTML += "<tr><td>" + NAME + ":</td><td>" + SCORE + " points</td></tr>";
            });
                
            
        });

    }
    //----------------------------------------------------------------------//
}
//END OF HighScoreDisplay
//----------------------------------------------------------------------//

FB_Init.init();
const ASTRO_EXPLORER = document.getElementById('o-astroExplorer-high-score-list');
const OTHER_GAME = document.getElementById('o-otherGame-high-score-list');

addEventListener("load", ()=>{
    if (ASTRO_EXPLORER) {HighScoreDisplay.displayHighScores("astroExplorer");} 
    if (OTHER_GAME) {HighScoreDisplay.displayHighScores("otherGame");}
});