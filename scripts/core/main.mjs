//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Main                                                                  //
//Sets off the game class                                               //
//----------------------------------------------------------------------//
import {Game} from './game.mjs';
import { FB_Init } from '../data/firebase/fb_init.mjs';

//Initialize firebase
FB_Init.init();

//Start the game
Game.Start();