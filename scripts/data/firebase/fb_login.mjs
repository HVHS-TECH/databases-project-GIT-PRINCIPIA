//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_login.mjs                                                          //
//handles login logic                                                   //
//----------------------------------------------------------------------//

import {initializeApp} from 'https://cdn.skypack.dev/@firebase/app';
import {getDatabase, ref, set} from 'https://cdn.skypack.dev/@firebase/database';
import {getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserSessionPersistence} from 'https://cdn.skypack.dev/@firebase/auth';
import { FB_User } from './fb_data.mjs';
import { FB_IO } from './fb_io.mjs';

//----------------------------------------------------------------------//
//FB_Login class - handles login logic
export class FB_Login {
    //----------------------------------------------------------------------//
    //login()
    static unsubscribeAuthStateChanged = null;
    static login(cb = ()=>{}) {
        console.log("login");
        if (FB_Login.loggedIn()) return; //Already logged in

        console.log("not logged in");
        FB_Login.unsubscribeAuthStateChanged = onAuthStateChanged(getAuth(), (user) =>{FB_Login.authStateChangedCB(user, cb);});
        
    }
    static async authStateChangedCB(user, cb) {
        console.log("onAuthStateChanged()");
        FB_Login.unsubscribeAuthStateChanged();
        if (user) {
            console.log("already logged in");
            await parseLoginData(user);
            
        } else {
            console.log("new log in");
            user = (await signInWithPopup(getAuth(), new GoogleAuthProvider())).user;
            console.log("Logged in with ");
            console.dir(user);
            await parseLoginData(user);
        }
        console.log("login done");
        cb(); //Call the callback once the user is logged in
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //logout()
    static logout() {
        console.log("logout");
        FB_User.loggedIn = false;
        signOut(getAuth());
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //userExists(uid)
    //does the user with the uid 'uid' exist?
    static async userExists(uid) {
        return (await FB_IO.read('game-site/users/' + uid)) != null;
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

    if (!(await FB_Login.userExists(FB_User.uid))) {
        //User does not exist
        //Create a user
        FB_IO.write('game-site/users/' + FB_User.uid + '/accountName/', '', FB_User.accountName);
        FB_IO.write('game-site/users/' + FB_User.uid + '/age/', '', FB_User.age);
        FB_IO.write('game-site/users/' + FB_User.uid + '/email/', '', FB_User.email);
        FB_IO.write('game-site/users/' + FB_User.uid + '/username', '', FB_User.username);
    }
}
//----------------------------------------------------------------------//