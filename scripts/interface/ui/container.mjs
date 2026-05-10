//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Container class                                                       //
//Provides a box container which can hold multiple items.               //
//Items stored inside are aligned to the container and move with it.    //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";



//----------------------------------------------------------------------//
//Container / box class, can have contents
export class Container extends UIelement {
    constructor(pos, align, width, height, background, outline, outlineWidth, items) {
        super(pos, align, width, height);

        this.background = background;
        this.outline = outline;
        this.outlineWidth = outlineWidth;

        this.items = items;
        //Initialize items' parents
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] != null) {
                this.items[i].parent = this;
            }
        }
    }

    Update() {
        
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] != null) {
                this.items[i].parent = this;
                this.items[i].Update();
            }
        }
        
    }
    Draw() {
        var center = this.GetCenter();
        //----------------------------------------//
        //Draw the background
        var tl = center.add(new Vec2(-this.width / 2, this.height / 2));
        var br = center.add(new Vec2(this.width / 2, -this.height / 2));
        Game.renderer.stroke(this.outline, this.outlineWidth, false, true);
        Game.renderer.fill(this.background);
        Game.renderer.rect(tl, br, false, true);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
        //----------------------------------------//
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] != null) {
                this.items[i].Draw();
            }
        }

    }
}
//----------------------------------------------------------------------//