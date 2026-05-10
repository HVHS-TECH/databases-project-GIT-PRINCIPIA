//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//VertMeter class                                                       //
//An object representing a vertical meter (like a slider) to display a  //
//number as a filled rectangle - where the height is proportional to    //
//the value wished to be displayed.                                     //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";

//----------------------------------------------------------------------//
//Vertical meter / guage
export class VertMeter extends UIelement {
    constructor(pos, align, width, height, background, fillColour, outlineColour, outlineWidth, valueRefVarName) {
        super(pos, align, width, height);
        
        this.background = background; //BG colour
        this.fillColour = fillColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
        this.valueRefVarName = valueRefVarName;
        this.value = 0;//Since this constructor is called in game, we cannot access game in this constructor
    }
    //----------------------------------------------------------------------//
    //Update()
    //Update the value of the meter from the reference variable
    Update() {
        this.value = Game.getRefVar(this.valueRefVarName);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Draw()
    //Draw the meter
    Draw() {
        var center = this.GetCenter();

        this.DrawBackground(center);

        this.DrawSlider(center);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawBackground(center)
    //Draws the background
    DrawBackground(center) {
        //----------------------------------------//
        //Draw the background
        var tl = center.add(new Vec2(-this.width / 2, this.height / 2));
        var br = center.add(new Vec2(this.width / 2, -this.height / 2));

        Game.renderer.stroke(this.outlineColour, this.outlineWidth, false, true);
        Game.renderer.fill(this.background);
        Game.renderer.rect(tl, br, false, true);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawSlider(center)
    //Draws the slider
    DrawSlider(center) {
        //----------------------------------------//
        //Draw the fill (slider)
        //This.value is from 0 - 1, so we must scale it by this.height
        //Give space for outline
        var fill_tl = center.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth)));
        var fill_br = center.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2));

        Game.renderer.fill(this.fillColour);
        Game.renderer.rect(fill_tl, fill_br, false, true);
        Game.renderer.fillShape();


        //Divider bar
        var divider_tl = center.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) + 5));
        var divider_br = center.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) - 5));

        Game.renderer.fill("black");
        Game.renderer.rect(divider_tl, divider_br, false, true);
        Game.renderer.fillShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//
}
//----------------------------------------------------------------------//