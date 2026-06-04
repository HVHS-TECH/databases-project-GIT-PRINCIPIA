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
    static htmlOageError = null;
    static htmlIloginWithDiffAccount = null;
    static htmlOloginResult = null;
    static htmlIusename = null;
    static htmlOnameError = null;

    //----------------------------------------//
    //Prevent incorrect ages
    static UNREASONABLE_SMALL_AGE = 0;
    static UNREASONABLE_LARGE_AGE = 130;
    //----------------------------------------//

    //----------------------------------------//
    //Prevent invalid usernames
    static MAX_USERNAME_LENGTH = 10;
    static MIN_USERNAME_LENGTH = 3;
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
        GameSite.htmlOageError = document.getElementById("o-age-error");
        GameSite.htmlIloginWithDiffAccount = document.getElementById("i-login-diff-account");
        GameSite.htmlOloginResult = document.getElementById("o-login-result");
        GameSite.htmlIusename = document.getElementById("i-name");
        GameSite.htmlOnameError = document.getElementById("o-name-error");


        GameSite.login();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //login()
    static async login(extraCB = ()=>{}) {
        FB_Login.login(()=>{GameSite.handleLogin(); extraCB();});
            
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //signUp()
    static async signUp() {
        if (await GameSite.validateAge() && await GameSite.validateName()) {
            
            await GameSite.logInDiffAccount(GameSite.handleLogin);
            FB_Login.createUser(); //Write details such as username and age

        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //validateAge()
    static async validateAge() {
        //----------------------------------------//
        const AGE = GameSite.htmlIage.value;
        if (AGE <= GameSite.UNREASONABLE_SMALL_AGE) {
            //user has inputted an unreasonably small age
            console.warn("GameSite::validateAge() user has inputted an unreasonably small age.")
            GameSite.htmlOageError.innerText = "Please input an age above " + GameSite.UNREASONABLE_SMALL_AGE + " and below " + GameSite.UNREASONABLE_LARGE_AGE;
            await FB_Login.logout();
            return false;
        }

        if (AGE >= GameSite.UNREASONABLE_LARGE_AGE) {
            //user has inputted an unreasonably large age
            console.warn("GameSite::validateAge() user has inputted an unreasonably large age.")
            GameSite.htmlOageError.innerText = "Please input an age above " + GameSite.UNREASONABLE_SMALL_AGE + " and below " + GameSite.UNREASONABLE_LARGE_AGE;
            await FB_Login.logout();
            return false;
        }

        if (AGE < GameSite.MIN_AGE) {
            //user is too young to play
            console.warn("GameSite::validateAge() user is too young to play (age < " + GameSite.MIN_AGE + ")");
            GameSite.htmlOageError.innerText = "You must be older than " + GameSite.MIN_AGE + " to play";
            await FB_Login.logout();
            return false;
        }
        //----------------------------------------//
        GameSite.htmlOageError.innerText = "";
        FB_User.age = AGE;
        return true;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //validateName()
    static async validateName() {
        const NAME = GameSite.htmlIusename.value.trim(); //Remove leading and trailing whitespace

        if (NAME.length > GameSite.MAX_USERNAME_LENGTH) {
            console.warn("GameSite::validateName(): username is too long!");
            GameSite.htmlOnameError.innerText = "Username must be within " + GameSite.MIN_USERNAME_LENGTH + " - " + GameSite.MAX_USERNAME_LENGTH + " characters";
            await FB_Login.logout();
            return false;
        }

        if (NAME.length < GameSite.MIN_USERNAME_LENGTH) {
            console.warn("GameSite::validateName(): username is too short!");
            GameSite.htmlOnameError.innerText = "Username must be within " + GameSite.MIN_USERNAME_LENGTH + " - " + GameSite.MAX_USERNAME_LENGTH + " characters";
            await FB_Login.logout();
            return false;
        }
        GameSite.htmlOnameError.innerText = "";
        FB_User.username = NAME;
        return true;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //handleLogin()
    static async handleLogin() {
        console.log("GameSite::handleLogin()");
        if (!(await FB_Login.userExists(FB_User.uid))) {
            //User does not exist
            console.log("User does not exist! They will need to register an account");
            GameSite.htmlOloginResult.innerText = "There is no user registered under this Google Account.\n (email: " + FB_User.email + ")\nPlease use the 'Sign Up' button to create an account under this Google Account"
            await FB_Login.logout();
            return;
        }
        //Inform user of which account they are logged in with
        GameSite.htmlOloginResult.innerText = "Logged in with email: '" + FB_User.email + "' \nUsername: '" + FB_User.username + "'";
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
    static async logInDiffAccount(cb = ()=>{}) {
        await FB_Login.logout();
        GameSite.login(cb);
    }
    //----------------------------------------------------------------------//
}
//END OF GameSite
//----------------------------------------------------------------------//

addEventListener("load", GameSite.init); //Initialize once the page loads (so that html elements are available)



