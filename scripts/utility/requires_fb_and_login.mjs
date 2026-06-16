//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//requires_fb_and_login.mjs                                             //
//Logs the user in after initializing firebase                          //
//----------------------------------------------------------------------//

//MUST BE THE FIRST SCRIPT TO LOAD

import { FB_Init } from "../data/firebase/fb_init.mjs";
import { FB_Login } from "../data/firebase/fb_login.mjs";
import { CustomEvent } from "./event.mjs";
window.fb_onlogin = new CustomEvent();
window.fb_invalidLogin = new CustomEvent();
console.log("added events");
addEventListener('load', ()=>{
    console.log("load");
    console.log(window.fb_onlogin);
    console.log(window.fb_invalidLogin);
    FB_Init.init();
    FB_Login.login(window.fb_onlogin.run, window.fb_invalidLogin.run);
});
