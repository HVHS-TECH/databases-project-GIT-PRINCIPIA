//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//A class describing a ring of arrows around the screen                 //
//These arrows point to each of the planets, and are coloured:          //
//                                                                      //
// - White => the planet is very far away                               //
//                                                                      //
// - Green => the planet is at a safe distance to start slowing down    //
//                                                                      //
// - Orange => the planet is at a somewhat unsafe distance to start     //
//             slowing down                                             //
//                                                                      //
// - Red => the planet is too close to land on at the current speed,    //
//             and the planet must divert to the side                   //
//                                                                      //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";


//----------------------------------------------------------------------//
//Arrows pointing to planets
export class PlanetArrows extends UIelement {
    
}
//----------------------------------------------------------------------//