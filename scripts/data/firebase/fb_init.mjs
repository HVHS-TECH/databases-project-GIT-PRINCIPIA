//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_init.mjs                                                           //
//handles initializing the firebase database                            //
//----------------------------------------------------------------------//

import {initializeApp} from 'https://cdn.skypack.dev/@firebase/app';
import {getDatabase, ref, set} from 'https://cdn.skypack.dev/@firebase/database';
import {FB_IO} from './fb_io.mjs';

//----------------------------------------------------------------------//
//FB_Data class to hold firebase information
export class FB_Data {
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
//FB class - firebase handle
export class FB_Init {
    //----------------------------------------------------------------------//
    //init()
    //initializes firebase
    static init() {
        console.log("FB::init()");
        FB_Data.app = initializeApp(FB_Data.cfg);
        FB_Data.db = getDatabase();
        FB_IO.write('/asdf/', 'asdf', 0);
        FB_IO.read('/asdf/');
        FB_IO.addWriteListener('/high-scores/', (value)=>{console.dir(value.val());});
    }
    //----------------------------------------------------------------------//
}
//END OF FB_Init
//----------------------------------------------------------------------//
