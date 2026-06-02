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
import { Game } from "../astro-explorer/core/game.mjs";
import { FB_IO } from "../data/firebase/fb_io.mjs";


//----------------------------------------------------------------------//
//GameSite class - handles registration and login, as well as unlocking games
export class GameSite {
    static htmlAstroExplorerPlay = null;
    static htmlOtherGamePlay = null;
    static htmlIage = null;
    static htmlIageError = null;
    static htmlIloginWithDiffAccount = null;
    static htmlOinformEmail = null;
    static htmlIusename = null;

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
        Exposure.expose(GameSite.signUp, "signUp");
        Exposure.expose(GameSite.logInDiffAccount, "logInDiffAccount");
        FB_Init.init();

        GameSite.htmlAstroExplorerPlay = document.getElementById("astro-explorer");
        GameSite.htmlOtherGamePlay = document.getElementById("other-game");
        GameSite.htmlIage = document.getElementById("i-age");
        GameSite.htmlIageError = document.getElementById("i-age-error");
        GameSite.htmlIloginWithDiffAccount = document.getElementById("i-login-diff-account");
        GameSite.htmlOinformEmail = document.getElementById("o-inform-email");
        GameSite.htmlIusename = document.getElementById("i-name");


        GameSite.login();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //login()
    static async login() {
        FB_Login.login(GameSite.handleLogin);
            
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //signUp()
    static async signUp() {
        const USERNAME = GameSite.htmlIusename.value;
        FB_User.username = USERNAME;
        console.log(USERNAME);
        if (GameSite.validateAge()) {
            
            GameSite.logInDiffAccount(GameSite.handleLogin);

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
    //handleLogin()
    static handleLogin() {
        console.log("GameSite::handleLogin()");
        //Inform user of which account they are logged in with
        GameSite.htmlOinformEmail.innerText = "Logged in with email: '" + FB_User.email + "'";
        GameSite.unlockGames();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //unlockGames()
    static unlockGames() {
        console.log("GameSite::unlockGames()");
        //----------------------------------------//
        if (!FB_User.loggedIn) {
            console.warn("GameSite::unlockGames() called on a user who is not logged in");
            return;
        }
        //----------------------------------------//


        GameSite.htmlIloginWithDiffAccount.style.display = "flex";



        GameSite.htmlAstroExplorerPlay.disabled = false;
        GameSite.htmlOtherGamePlay.disabled = false;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //logInDiffAccount()
    //Log in with a different account
    static logInDiffAccount(cb = ()=>{}) {
        FB_Login.logout();
        FB_Login.login(cb);
    }
    //----------------------------------------------------------------------//
}
//END OF GameSite
//----------------------------------------------------------------------//

addEventListener("load", GameSite.init); //Initialize once the page loads (so that html elements are available)



