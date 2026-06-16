//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//block_content.mjs                                                     //
//Blocks buttons, etc when the user is not logged in                    //
//----------------------------------------------------------------------//

import { FB_Login } from "../data/firebase/fb_login.mjs";
import { Event } from "./event.mjs";
//----------------------------------------------------------------------//
//BlockContent class - handles blocking content that requires the user to be logged in
export class BlockContent {
    static htmlButtonsToBlock = [];

    //----------------------------------------------------------------------//
    //init()
    static init() {
        BlockContent.initData();
        BlockContent.initCallbacks();
        BlockContent.update();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //initData()
    static initData() {
        const TO_DISABLE_WHEN_LOGGED_OUT = document.getElementsByClassName('disable-when-logged-out');
        BlockContent.htmlButtonsToBlock = TO_DISABLE_WHEN_LOGGED_OUT;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //initCallbacks()
    static initCallbacks() {
        FB_Login.addAuthStateChangedCB(BlockContent.update);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //update(user)
    //updates any blocked content's blockage status
    static async update(user) {
        const DISABLE_STATUS = !((user) && (await FB_Login.userExists(user.uid)));

        for (var i = 0; i < BlockContent.htmlButtonsToBlock.length; i++) {
            BlockContent.htmlButtonsToBlock.disabled = DISABLE_STATUS;
        }
    }
    //----------------------------------------------------------------------//
}
//END OF BlockContent
//----------------------------------------------------------------------//



window.fb_onlogin.subscribe(BlockContent.init);