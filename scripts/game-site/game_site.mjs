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


//----------------------------------------------------------------------//
//GameSite class - handles registration and login, as well as unlocking games
export class GameSite {
    static htmlAstroExplorerPlay = null;
    static htmlOtherGamePlay = null;
    static htmlIage = null;
    static htmlIageError = null;
    static htmlIlogin = null;
    static htmlIloginWithDiffAccount = null;

    //----------------------------------------//
    //Prevent incorrect ages
    static UNREASONABLE_SMALL_AGE = 0;
    static UNREASONABLE_LARGE_AGE = 130;
    //----------------------------------------//

    static MIN_AGE = 10; 

    //----------------------------------------------------------------------//
    //init()
    static init() {
        console.log("GameSite::init()");
        Exposure.expose(GameSite.login, "login");
        Exposure.expose(GameSite.logInDiffAccount, "logInDiffAccount");
        FB_Init.init();

        GameSite.htmlAstroExplorerPlay = document.getElementById("astro-explorer");
        GameSite.htmlOtherGamePlay = document.getElementById("other-game");
        GameSite.htmlIage = document.getElementById("i-age");
        GameSite.htmlIageError = document.getElementById("i-age-error");
        GameSite.htmlIlogin = document.getElementById("i-login");
        GameSite.htmlIloginWithDiffAccount = document.getElementById("i-login-diff-account");
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //login()
    static async login() {
        if (GameSite.validateAge()) {
            
            FB_Login.login(GameSite.unlockGames);
            
        } else {
            FB_Login.logout();
        }
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //validateAge()
    static validateAge() {
        //----------------------------------------//
        const AGE = GameSite.htmlIage.value;
        if (AGE <= GameSite.UNREASONABLE_SMALL_AGE) {
            //user has inputted an unreasonably small age
            console.warn("GameSite::unlockGames() user has inputted an unreasonably small age.")
            GameSite.htmlIageError.innerText = "Please input an age above " + GameSite.UNREASONABLE_SMALL_AGE + " and below " + GameSite.UNREASONABLE_LARGE_AGE;
            FB_Login.logout();
            return false;
        }

        if (AGE >= GameSite.UNREASONABLE_LARGE_AGE) {
            //user has inputted an unreasonably large age
            console.warn("GameSite::unlockGames() user has inputted an unreasonably large age.")
            GameSite.htmlIageError.innerText = "Please input an age above " + GameSite.UNREASONABLE_SMALL_AGE + " and below " + GameSite.UNREASONABLE_LARGE_AGE;
            FB_Login.logout();
            return false;
        }

        if (AGE < GameSite.MIN_AGE) {
            //user is too young to play
            console.warn("GameSite::unlockGames() user is too young to play (age < " + GameSite.MIN_AGE + ")");
            GameSite.htmlIageError.innerText = "You must be older than " + GameSite.MIN_AGE + " to play";
            FB_Login.logout();
            return false;
        }
        //----------------------------------------//

        FB_User.age = AGE;
        return true;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //unlockGames()
    static unlockGames() {

        //----------------------------------------//
        if (!FB_User.loggedIn) {
            console.warn("GameSite::unlockGames() called on a user who is not logged in");
            return;
        }
        //----------------------------------------//


        GameSite.htmlIlogin.style.display = "none";
        GameSite.htmlIloginWithDiffAccount.style.display = "flex";



        GameSite.htmlAstroExplorerPlay.disabled = false;
        GameSite.htmlOtherGamePlay.disabled = false;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //logInDiffAccount()
    //Log in with a different account
    static logInDiffAccount() {
        FB_Login.logout();
        FB_Login.login();
    }
    //----------------------------------------------------------------------//
}
//END OF GameSite
//----------------------------------------------------------------------//

addEventListener("load", GameSite.init); //Initialize once the page loads (so that html elements are available)



