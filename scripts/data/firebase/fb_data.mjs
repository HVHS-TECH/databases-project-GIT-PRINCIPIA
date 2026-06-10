//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_data.mjs                                                           //
//stores data about the database (client side)                          //
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//FB_Data class to hold firebase information
export class FB_Data {
    static PATH_TO_USER_LIST = "gameSite/users/";
    static cfg = {
        apiKey: "AIzaSyCg_wVQVx1Jr6JcXnxIjs58owZ9laB7Llo",
        authDomain: "alex-curwen-12comp.firebaseapp.com",
        databaseURL: "https://alex-curwen-12comp-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "alex-curwen-12comp",
        storageBucket: "alex-curwen-12comp.firebasestorage.app",
        messagingSenderId: "842988938683",
        appId: "1:842988938683:web:d4ddeaa78536ac10b9109e"
    };
    static app = null;
    static db = null;
    
    

}
//END OF FB_Data
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//FB_User class to hold user information
export class FB_User {
    static loggedIn = false;

    static uid = null;
    static age = null;
    static tempAge = null;
    static username = null;
    static tempUsername = null;
    static email = null;

    static accountName = null;

    static photoURL = null;
}
//END OF FB_User
//----------------------------------------------------------------------//