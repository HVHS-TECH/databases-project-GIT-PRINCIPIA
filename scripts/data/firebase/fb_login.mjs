//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_login.mjs                                                          //
//handles login logic                                                   //
//----------------------------------------------------------------------//

import {initializeApp} from 'https://cdn.skypack.dev/@firebase/app';
import {getDatabase, ref, set} from 'https://cdn.skypack.dev/@firebase/database';
import {getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserSessionPersistence} from 'https://cdn.skypack.dev/@firebase/auth';
import { FB_Data, FB_User } from './fb_data.mjs';
import { FB_IO } from './fb_io.mjs';

//----------------------------------------------------------------------//
//FB_Login class - handles login logic
export class FB_Login {
    

    //----------------------------------------------------------------------//
    //login()
    static unsubscribeAuthStateChanged = null;

    static async login(cb = ()=>{}, invalidLogin = ()=>{}) {
        console.log("login");
        var userExists;
        if (FB_User.uid == null) {
            //First time signing in to this page
            console.log("UID = null");
            console.log(getAuth());
            if (getAuth().currentUser != null) {
                //The user is logged in with a google account, check if it is in the database
                console.log("LOGGED IN - checking with db");
                userExists = await FB_Login.userExists(getAuth().currentUser.uid);
            } else {
                //The user really isn't signed in to the site 
                //(but maybe they are to google - the onAuthStateChanged callback will check this)
                console.log("Really not logged in");
                userExists = false;
            }
        } else {
            //Not the first time signing in
            console.log("UID != null");

            //Safe, because UID is cleared on logout.
            //If it wasn't it might be possible to log in with a google account that does not exist in the db
            //using the last login's uid

            //but it's safe because the uid is clear on logout
            userExists = await FB_Login.userExists(FB_User.uid); 
        }
        console.log("Curr user exists: " + userExists);
        console.log("UID: " + FB_User.uid);
        if (FB_Login.loggedIn() && userExists) {
            console.log("already logged in");
            cb();
            return; //Already logged in
        }

        console.log("not logged in");
        FB_Login.unsubscribeAuthStateChanged = onAuthStateChanged(getAuth(), (user) =>{FB_Login.authStateChangedCB(user, cb, invalidLogin);});
        
    }
    static async authStateChangedCB(user, cb, invalidLogin) {
        console.log("onAuthStateChanged()");
        FB_Login.unsubscribeAuthStateChanged(); //Prevent multiple listeners from stacking
        if (user && await FB_Login.userExists(user.uid)) {
            //The user is now signed in automatically
            console.log("already logged in");
            await parseLoginData(user);
            
        } else {
            //The user is really really not logged in
            console.log("new log in");
            try {
                console.log("opening popup");
                user = (await signInWithPopup(getAuth(), new GoogleAuthProvider())).user;
                console.log("popup ended");
            }
            catch (error) {
                const CODE = error.code;
                const MSG = error.message;

                console.error("Error " + CODE + " in login::authStateChangedCB, message: \n'" + MSG + "'");

                FB_Login.logout();
                invalidLogin();
                return;
            }
            
            console.log("Logged in");
            await parseLoginData(user);
            
        }
        //If FB_User.tempUsername != null, then the user is trying to sign up
        //Obviously, the user does not have an account if they are trying to sign up
        //But, we still want to let them through - they are CREATING an account
        if (!await FB_Login.userExists(FB_User.uid) && FB_User.tempUsername == null) {
            //The login is invalid
            console.log("Invalid login");
            FB_Login.logout();
            invalidLogin();
            return;
        }
        console.log("login done");
        cb(); //Call the callback once the user is logged in
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //logout()
    static async logout() {
        console.log("logout");
        FB_User.loggedIn = false;
        FB_User.accountName = null;
        FB_User.age = null;
        FB_User.email = null;
        FB_User.photoURL = null;
        FB_User.username = null;
        FB_User.uid = null; //VERY IMPORTANT for safety. See FB_Login.login
        await signOut(getAuth());
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //userExists(uid)
    //does the user with the uid 'uid' exist?
    static async userExists(uid) {
        console.log("checking if user exists with uid " + uid);
        //Read the username, because other data is not allowed to be read for privacy
        return (await FB_IO.read('gameSite/users/' + uid + "/username")) != null;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //loggedIn()
    //PERSISTS ACROSS PAGES
    static loggedIn() {
        const USER = getAuth().currentUser;
        if (USER) return true; //The user exists (not null)
        return false;
    }
    //----------------------------------------------------------------------//
    


    //----------------------------------------------------------------------//
    //createUser()
    static createUser() {
        FB_IO.write(FB_Data.PATH_TO_USER_LIST + FB_User.uid + '/accountName/', '', FB_User.accountName);
        FB_IO.write(FB_Data.PATH_TO_USER_LIST + FB_User.uid + '/age/', '', FB_User.age);
        FB_IO.write(FB_Data.PATH_TO_USER_LIST + FB_User.uid + '/email/', '', FB_User.email);
        FB_IO.write(FB_Data.PATH_TO_USER_LIST + FB_User.uid + '/username', '', FB_User.username);
        FB_IO.write(FB_Data.PATH_TO_USER_LIST + FB_User.uid + '/photoURL', '', FB_User.photoURL);
    
    }
    //----------------------------------------------------------------------//

}
//END OF FB_Login
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//parseLoginData(result)
//result: the result of the login popup
async function parseLoginData(result) {
    FB_User.accountName = result.displayName;
    FB_User.uid = result.uid;
    FB_User.loggedIn = true;
    FB_User.email = result.email;
    //Since FB_User.username will ONLY be not null when you are trying to sign up
    if (FB_User.tempUsername == null) {
        FB_User.username = await FB_IO.read(FB_Data.PATH_TO_USER_LIST + FB_User.uid + "/username");
    } else {
        FB_User.username = FB_User.tempUsername;
    }
    if (FB_User.tempAge == null) {
        FB_User.age = await FB_IO.read(FB_Data.PATH_TO_USER_LIST + FB_User.uid + "/age");
    } else {
        FB_User.age = FB_User.tempAge;
    }
    FB_User.photoURL = result.photoURL;
}
//----------------------------------------------------------------------//