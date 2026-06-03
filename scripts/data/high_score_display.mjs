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

        const READ = FB_IO.readOrderedByValue('gameSite/' + game + "HighScores/");
        //RESEARCH READORDEREDBYVALUE USING CHILDREN OF THE NODE AS THE SORTING VALUES

        element.innerHTML = "<tr><th>Name</th><th>Score</th></tr>"; //Start of the table

        for (var i = 0; i < READ.length; i++) {
            const NAME = (await FB_IO.read(FB_Data.PATH_TO_USER_LIST + READ[i].key() + "/username"));
            const SCORE = READ[i].val();

            element.innerHTML += "<tr><td>" + NAME + ":</td><td>" + SCORE + " points</td></tr>";
        }

    }
    //----------------------------------------------------------------------//
}
//END OF HighScoreDisplay
//----------------------------------------------------------------------//

FB_Init.init();
const ASTRO_EXPLORER = document.getElementById('o-astro-explorer-high-score-list');
const OTHER_GAME = document.getElementById('o-other-game-high-score-list');

addEventListener("load", ()=>{
    if (ASTRO_EXPLORER) {HighScoreDisplay.displayHighScores("astroExplorer");} 
    if (OTHER_GAME) {HighScoreDisplay.displayHighScores("otherGame");}
});