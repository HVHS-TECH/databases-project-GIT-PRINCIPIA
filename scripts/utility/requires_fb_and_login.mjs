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
window.onlogin = new CustomEvent();
window.invalidLogin = new CustomEvent();
console.log("added events");
addEventListener('load', ()=>{
    console.log("load");
    console.log(window.onlogin);
    console.log(window.invalidLogin);
    FB_Init.init();
    FB_Login.login(window.onlogin._, window.invalidLogin._);
});
