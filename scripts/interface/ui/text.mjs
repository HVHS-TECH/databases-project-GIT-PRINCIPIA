//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Text class                                                            //
//Provides a text object (class) with the ability to handle multiple    //
//lines and rendering, as well as content updating                      //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp, Colour} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";
import { State } from "../../data/state.mjs";


//----------------------------------------------------------------------//
//text object
export class Text extends UIelement {
    constructor(pos, align, width, height, fontColour, fontSize, font, textAlignX, textAlignY, contentsRef) {
        super(pos, align, width, height);
        this.fontColour = fontColour;
        this.fontSize = fontSize;
        this.font = font;
        this.textAlignX = textAlignX;
        this.textAlignY = textAlignY;
        this.contentsRef = contentsRef;
        this.contents = "";
        this.textArray = [];
    }
    Update() {
        this.contents = Game.getRefVar(this.contentsRef);
        this.textArray = this.contents.split('\n'); //Split the text into individual lines

    }
    Draw() {
        var center = this.GetCenter();
        //Game.renderer.cnv.font = this.fontSize + "px " + this.font;
        Game.renderer.fill(this.fontColour);
        Game.renderer.text(this.contents, this.textAlignX, this.textAlignY, this.fontSize, this.font, center, false, true);
        

        //----------------------------------------//
        //If applicable, draw debug information
        if (State.debugMode) {
            //Draw debug text
            const POS_CAM_SPACE = this.GetCenter();
            const POS_CANVAS_SPACE = POS_CAM_SPACE.mul(new Vec2(1, -1)).div(Game.renderer.scaleCnvSize).mul(Game.renderer.cnvHeight).add(Game.renderer.cnvHalfDimen);
            Game.renderer.fill(Colour.rgb(255, 255, 255));
            Game.renderer.text(
                "Alignment to parent: x: " + this.alignment.x + ", y: " + this.alignment.y + "\n" +
                "Position camera space: x: " + Math.round(POS_CAM_SPACE.x) + ", y: " + Math.round(POS_CAM_SPACE.y) + "\n" +
                "Position canvas space: x: " + Math.round(POS_CANVAS_SPACE.x) + ", y: " + Math.round(POS_CANVAS_SPACE.y) + "\n" + 
                "Parent position: x: " + Math.round(this.parent.GetCenter().x) + ", y: " + Math.round(this.parent.GetCenter().y) + "\n" + 
                "Offset to alignment: x: " + Math.round(this.pos.x) + ", y: " + Math.round(this.pos.y),
                'center', 'middle',
                15,
                'monospace',
                center.sub(new Vec2(0, 50)),
                false,
                true
            );
        }
        //----------------------------------------//
        
    }
}
//----------------------------------------------------------------------//