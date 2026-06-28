//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game_site                                                             //
//Handles game site functions and logic                                 //
//----------------------------------------------------------------------//

import { Exposure } from "../utility/exposure.mjs";
import { FB_Login } from "../data/firebase/fb_login.mjs";
import { FB_Data, FB_User } from "../data/firebase/fb_data.mjs";
import { FB_Init } from "../data/firebase/fb_init.mjs";
import { Game } from "../astro-explorer/core/game.mjs";
import { FB_IO } from "../data/firebase/fb_io.mjs";
import { CustomEvent } from "../utility/event.mjs";
//----------------------------------------------------------------------//
//GameSite class - handles registration and login, as well as unlocking games
export class GameSite {
    static htmlPlayButtons = [];
    static htmlReviewsRedirect = null;
    static htmlIage = null;
    static htmlOageError = null;
    static htmlIloginWithDiffAccount = null;
    static htmlOloginResult = null;
    static htmlIusename = null;
    static htmlOnameError = null;

    //----------------------------------------//
    //Prevent incorrect ages
    static UNREASONABLE_SMALL_AGE = 5;
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
        Exposure.expose(()=>{GameSite.logInDiffAccount(CustomEvent.empty, GameSite.handleLogin);}, "logInDiffAccount");

        GameSite.htmlPlayButtons.push(document.getElementById("astro-explorer"));
        GameSite.htmlPlayButtons.push(document.getElementById("geo-dash"));
        GameSite.htmlReviewsRedirect = document.getElementById("reviews");
        GameSite.htmlIage = document.getElementById("i-age");
        GameSite.htmlOageError = document.getElementById("o-age-error");
        GameSite.htmlIloginWithDiffAccount = document.getElementById("i-login-diff-account");
        GameSite.htmlOloginResult = document.getElementById("o-login-result");
        GameSite.htmlIusename = document.getElementById("i-name");
        GameSite.htmlOnameError = document.getElementById("o-name-error");

        GameSite.htmlIloginWithDiffAccount.disabled = true;
        GameSite.htmlOloginResult.innerHTML = "<b><i>Logging in...</i></b>"


        
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //login()
    static async login(extraCB = CustomEvent.empty, invalidLogin = CustomEvent.empty) {
        FB_Login.login(new CustomEvent(()=>{extraCB.run();}, GameSite.handleLogin), invalidLogin);
        
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //signUp()
    static async signUp() {
        FB_User.tempUsername = null;
        FB_User.tempAge = null;
        if (await GameSite.validateAge() && await GameSite.validateName()) {
            
            GameSite.logInDiffAccount(new CustomEvent(FB_Login.createUser), new CustomEvent(()=>{FB_User.email = null; }, GameSite.handleLogin));

        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //validateAge()
    static async validateAge() {
        //----------------------------------------//
        const VAL = GameSite.htmlIage.value;
        if (typeof VAL == "number") {
            //Not a number
            console.warn("GameSite::validateAge() user has inputted a non-number age.");
            GameSite.htmlOageError.innerHTML = "<b>Please input a number</b>";
            await FB_Login.logout();
            return false;
        }
        const AGE = Math.round(VAL);
        if (AGE <= GameSite.UNREASONABLE_SMALL_AGE) {
            //user has inputted an unreasonably small age
            console.warn("GameSite::validateAge() user has inputted an unreasonably small age.");
            GameSite.htmlOageError.innerHTML = "<b>Please input an age above " + GameSite.UNREASONABLE_SMALL_AGE + " and below " + GameSite.UNREASONABLE_LARGE_AGE + "</b>";
            await FB_Login.logout();
            return false;
        }

        if (AGE >= GameSite.UNREASONABLE_LARGE_AGE) {
            //user has inputted an unreasonably large age
            console.warn("GameSite::validateAge() user has inputted an unreasonably large age.");
            GameSite.htmlOageError.innerHTML = "<b>Please input a real age above " + GameSite.UNREASONABLE_SMALL_AGE + " and below " + GameSite.UNREASONABLE_LARGE_AGE + "</b>";
            await FB_Login.logout();
            return false;
        }

        if (AGE < GameSite.MIN_AGE) {
            //user is too young to play
            console.warn("GameSite::validateAge() user is too young to play (age < " + GameSite.MIN_AGE + ")");
            GameSite.htmlOageError.innerHTML = "<b>You must be older than " + GameSite.MIN_AGE + " to play</b>";
            await FB_Login.logout();
            return false;
        }
        //----------------------------------------//
        GameSite.htmlOageError.innerText = "";
        FB_User.tempAge = AGE;
        return true;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //validateName()
    static async validateName() {
        const NAME = GameSite.htmlIusename.value.trim(); //Remove leading and trailing whitespace

        if (NAME.length > GameSite.MAX_USERNAME_LENGTH) {
            console.warn("GameSite::validateName(): username is too long!");
            GameSite.htmlOnameError.innerHTML = "<b>Username must be within " + GameSite.MIN_USERNAME_LENGTH + " - " + GameSite.MAX_USERNAME_LENGTH + " characters</b>";
            await FB_Login.logout();
            return false;
        }

        if (NAME.length < GameSite.MIN_USERNAME_LENGTH) {
            console.warn("GameSite::validateName(): username is too short!");
            GameSite.htmlOnameError.innerHTML = "<b>Username must be within " + GameSite.MIN_USERNAME_LENGTH + " - " + GameSite.MAX_USERNAME_LENGTH + " characters</b>";
            await FB_Login.logout();
            return false;
        }
        GameSite.htmlOnameError.innerHTML = "";
        FB_User.tempUsername = NAME;
        console.log("Name '" + NAME + "' is valid");
        return true;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //handleLogin()
    static async handleLogin() {
        console.log("GameSite::handleLogin()");
        FB_User.tempUsername = null;
        FB_User.tempAge = null;
        GameSite.htmlIloginWithDiffAccount.disabled = false;
        if (!(await FB_Login.userExists(FB_User.uid))) {
            //User does not exist
            console.log("User does not exist! They will need to register an account");
            GameSite.lockGames();
            if (FB_User.email != null) {

                GameSite.htmlOloginResult.innerHTML = "<b>There is no user registered under this Google Account.<br> (email: " + FB_User.email + ")<br>Please use the 'Sign Up' button to create an account under this Google Account</b>"
            } else {
                GameSite.htmlOloginResult.innerHTML = "<b>Please login using the button below</b>";

            }
            await FB_Login.logout();
            return;
        }
        //Inform user of which account they are logged in with
        //                                                            <br> acts as \n for html, since we are setting innerHTML not innerText
        //                                                                                           \/
        GameSite.htmlOloginResult.innerHTML = "<b>Logged in with email: '" + FB_User.email + "' </b><br><b>Username: '" + FB_User.username + "'</b>";
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


        for (var i = 0; i < GameSite.htmlPlayButtons.length; i++) {
            GameSite.htmlPlayButtons[i].disabled = false;
        }
        GameSite.htmlReviewsRedirect.disabled = false;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //lockGames()
    static lockGames() {
        console.log("GameSite::lockGames()");
        for (var i = 0; i < GameSite.htmlPlayButtons.length; i++) {
            GameSite.htmlPlayButtons[i].disabled = true;
        }
        GameSite.htmlReviewsRedirect.disabled = true;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //logInDiffAccount()
    //Log in with a different account
    static async logInDiffAccount(cb = CustomEvent.empty, invalidLogin = CustomEvent.empty) {
        await FB_Login.logout();
        GameSite.login(cb, invalidLogin);
    }
    //----------------------------------------------------------------------//
}
//END OF GameSite
//----------------------------------------------------------------------//
GameSite.init(); 
window.fb_onlogin.subscribe(()=>{GameSite.handleLogin();});
window.fb_invalidLogin.subscribe(()=>{GameSite.handleLogin();});



