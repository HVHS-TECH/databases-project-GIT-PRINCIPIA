//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//high_score_display.mjs                                                //
//handles displaying high scores to a table                             //
//----------------------------------------------------------------------//


import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_Init } from "./firebase/fb_init.mjs";


//----------------------------------------------------------------------//
//HighScoreDisplay class - handles displaying high score lists
export class HighScoreDisplay {
    //----------------------------------------------------------------------//
    //displayHighScores(game)
    //game: which game to get high scores from
    static async displayHighScores(game) {
        const ID = "o-" + game + "-high-score-list";
        
        var element = document.getElementById(ID);

        const HIGH_SCORE_LIST_READ = await FB_IO.read('game-site/users/');

        const USER_LIST = Object.keys(HIGH_SCORE_LIST_READ);

        var namesAndScores = [];

        for (var i = 0; i < USER_LIST.length; i++) {
            const NAME = HIGH_SCORE_LIST_READ[USER_LIST[i]]["accountName"];
            
            const SCORE = HIGH_SCORE_LIST_READ[USER_LIST[i]][game + '-high-score'];
            const NUM_CAST = Number(SCORE);

            if (NUM_CAST != undefined && NUM_CAST != null && NUM_CAST != NaN) {
                namesAndScores.push({score: NUM_CAST, name: NAME});
            } else {
                console.warn("HighScoreManager::displayHighScores(game): found invalid high score: " + NUM_CAST + " (original: " + SCORE + ")");
            }
            
        }

        namesAndScores.sort((a, b) => {return b.score - a.score;});

        element.innerHTML = "<tr><th>Name</th><th>Score</th></tr>"; //Start of the table

        for (var i = 0; i < namesAndScores.length; i++) {
            const NAME = namesAndScores[i].name;
            const SCORE = namesAndScores[i].score;

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
    if (ASTRO_EXPLORER) {HighScoreDisplay.displayHighScores("astro-explorer");} 
    if (OTHER_GAME) {HighScoreDisplay.displayHighScores("other-game");}
});