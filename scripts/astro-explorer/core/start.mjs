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

//Initialize firebase
FB_Init.init();
await FB_Login.login();

//Start the game
Game.Start();