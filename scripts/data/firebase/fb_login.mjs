//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_login.mjs                                                          //
//handles login logic                                                   //
//----------------------------------------------------------------------//

import {initializeApp} from 'https://cdn.skypack.dev/@firebase/app';
import {getDatabase, ref, set} from 'https://cdn.skypack.dev/@firebase/database';
import {getAuth, GoogleAuthProvider, signInWithPopup} from 'https://cdn.skypack.dev/@firebase/auth';
import { FB_User } from './fb_data.mjs';
import { FB_IO } from './fb_io.mjs';

//----------------------------------------------------------------------//
//FB_Login class - handles login logic
export class FB_Login {
    //----------------------------------------------------------------------//
    //login()
    static async login() {
        await signInWithPopup(getAuth(), new GoogleAuthProvider()).then((result)=>{parseLoginData(result);});
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //userExists(uid)
    //does the user with the uid 'uid' exist?
    static async userExists(uid) {
        return (await FB_IO.read('game-site/users/' + uid)) != null;
    }
    //----------------------------------------------------------------------//


}
//END OF FB_Login
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//parseLoginData(result)
//result: the result of the login popup
async function parseLoginData(result) {
    FB_User.accountName = result.user.displayName;
    FB_User.uid = result.user.uid;
    FB_User.loggedIn = true;

    if (!(await FB_Login.userExists(FB_User.uid))) {
        //User does not exist
        //Create a user
        FB_IO.write('game-site/users/' + FB_User.uid + '/accountName/', '', FB_User.accountName);
    }
}
//----------------------------------------------------------------------//