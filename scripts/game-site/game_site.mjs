//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game_site                                                             //
//Handles game site functions and logic                                 //
//----------------------------------------------------------------------//

import { Exposure } from "../utility/exposure.mjs";
import { FB_Login } from "../data/firebase/fb_login.mjs";
import { FB_User } from "../data/firebase/fb_data.mjs";
import { FB_Init } from "../data/firebase/fb_init.mjs";

export class GameSite {
    static html_astro_explorer_play = null;
    static html_other_game_play = null;

    //----------------------------------------------------------------------//
    //init()
    static init() {
        console.log("GameSite::init()");
        Exposure.expose(GameSite.login, "login");
        FB_Init.init();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //login()
    static async login() {
        await FB_Login.login();
        GameSite.unlockGames();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //unlockGames()
    static unlockGames() {
        if (!FB_User.loggedIn) {
            console.warn("GameSite::unlockGames() called on a user who is not logged in");
            return;
        }
        var html_astro_explorer_play = document.getElementById("astro-explorer");
        var html_other_game_play = document.getElementById("other-game");

        html_astro_explorer_play.disabled = false;
        html_other_game_play.disabled = false;
    }
    //----------------------------------------------------------------------//
}
addEventListener("load", GameSite.init);



