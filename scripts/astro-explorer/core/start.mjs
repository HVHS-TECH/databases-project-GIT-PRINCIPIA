//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//start                                                                  //
//Sets off the game class                                               //
//----------------------------------------------------------------------//
import {Game} from './game.mjs';
import { FB_Init } from '../../data/firebase/fb_init.mjs';
import { FB_Login } from '../../data/firebase/fb_login.mjs';


const ON_LOGIN = ()=> {
    Game.Start();
}
window.onLogin = ON_LOGIN;

const INVALID_LOGIN = ()=> {
    window.location.href = "../../index.html";
}
window.invalidLogin = INVALID_LOGIN;




