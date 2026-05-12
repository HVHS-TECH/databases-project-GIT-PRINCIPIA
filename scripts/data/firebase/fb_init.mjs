//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_init.mjs                                                           //
//handles initializing the firebase database                            //
//----------------------------------------------------------------------//

import {initializeApp} from 'https://cdn.skypack.dev/@firebase/app';
import {getDatabase, ref, set} from 'https://cdn.skypack.dev/@firebase/database';
import {FB_IO} from './fb_io.mjs';
import { FB_Data } from './fb_data.mjs';


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
    }
    //----------------------------------------------------------------------//
}
//END OF FB_Init
//----------------------------------------------------------------------//
