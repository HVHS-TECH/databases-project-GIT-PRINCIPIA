//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//requires_fb_and_login.mjs                                             //
//Logs the user in after initializing firebase                          //
//----------------------------------------------------------------------//

import { FB_Init } from "../data/firebase/fb_init.mjs";
import { FB_Login } from "../data/firebase/fb_login.mjs";

addEventListener('load', ()=>{
    if (window.onLogin == null) window.onLogin = ()=>{};
    if (window.invalidLogin == null) window.invalidLogin = ()=>{};
    FB_Init.init();
    FB_Login.login(window.onLogin, window.invalidLogin);
});
