//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//high_score_manager.mjs                                                //
//handles high score saving, loading and displaying                     //
//----------------------------------------------------------------------//

import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_Data } from "./firebase/fb_data.mjs";
import { FB_User } from "./firebase/fb_data.mjs";
import { State } from "./state.mjs";
import { Game } from "../astro-explorer/core/game.mjs";

//----------------------------------------------------------------------//
//HighScoreManager class - handles managing high score saving, loading and displaying
export class HighScoreManager {
    //----------------------------------------------------------------------//
    //getHighScore
    //cb: the callback to run once the high score has been retrieved
    //game: the name of the game to get the high score from
    static async getHighScore(cb, game) {
        console.log("getHighScore()");
        //----------------------------------------//
        //Ensure the user is logged in
        if (!FB_User.loggedIn) {
            console.warn("getHighScore(cb): user is not logged in!");
            cb(null);
            return;
        }
        //----------------------------------------//

        const READ = await FB_IO.read("gameSite/" + game + "HighScores" + FB_User.uid + '/');
        
        const HIGH_SCORE = READ;
        cb(HIGH_SCORE);
        console.log(HIGH_SCORE);
        return HIGH_SCORE;
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //setHighScore
    //score: the score value to set the high score to
    //game: the name of the game to set the high score for
    static setHighScore(score, game) {
        console.log("setHighScore()");
        //----------------------------------------//
        //Ensure the user is logged in
        if (!FB_User.loggedIn) {
            console.warn("setHighScore(): user is not logged in!");
            return;
        }
        //----------------------------------------//

        //Set the local storage high score as well
        State.setState(Game.HIGH_SCORE_ID, score);

        //Write to the firebase
        FB_IO.write("gameSite/" + game + "HighScores" + FB_User.uid + '/', '', score);
    }
    //----------------------------------------------------------------------//


    
}
//END OF HighScoreManager
//----------------------------------------------------------------------//

