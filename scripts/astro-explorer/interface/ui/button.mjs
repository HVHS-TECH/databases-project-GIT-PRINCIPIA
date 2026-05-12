//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Button class                                                          //
//A button, which can be pressed, and can hold items inside             //
//Items stored inside are aligned to the button and move with it.       //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";
import { Text } from "./text.mjs";



//----------------------------------------------------------------------//
//Container / box class, can have contents
export class Button extends UIelement {
    constructor(pos, align, width, height, background, pressedBackground, outline, pressedOutline, outlineWidth, pressedScale, items, onClick) {
        super(pos, align, width, height);

        this.pressedScale = pressedScale;
        this.pressedBackground = pressedBackground;
        this.pressedOutline = pressedOutline;
        
        this.currWidth = width;
        this.currHeight = height;
        this.currBackground = background;
        this.currOutline = outline;
        this.currOutlineWidth = outlineWidth;

        this.background = background;
        this.outline = outline;
        this.outlineWidth = outlineWidth;

        this.items = items;
        this.fontSizes = [];

        //Initialize items' parents
        for (var i = 0; i < this.items.length; i++) {
            this.fontSizes[i] = 0;
            if (this.items[i] != null) {
                this.items[i].parent = this;
                if (this.items[i] instanceof Text) {
                    //Cache fontsizes so that they can be scaled by pressed scale
                    this.fontSizes[i] = this.items[i].fontSize;
                }
                
            }
        }
        
        this.onClick = onClick;
    }

    Update() {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i] != null) {
                this.items[i].parent = this;
                this.items[i].Update();
            }
        }
        if (this.MousedOver(this.pos)) {
            this.currWidth = this.width * this.pressedScale;
            this.currHeight = this.height * this.pressedScale;
            this.currBackground = this.pressedBackground;
            this.currOutline = this.pressedOutline;
            this.currOutlineWidth = this.outlineWidth * this.pressedScale;

            //Scale the font sizes of any text items' contained inside the button
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i] != null && this.items[i] instanceof Text) {
                    this.items[i].fontSize = this.fontSizes[i] * this.pressedScale;
                }
            }
            if (Input.mouseDown) this.onClick();
        } else {
            this.currWidth = this.width;
            this.currHeight = this.height;
            this.currBackground = this.background;
            this.currOutline = this.outline;
            this.currOutlineWidth = this.outlineWidth;

            //Reset the font sizes of any text items' contained inside the button
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i] != null && this.items[i] instanceof Text) {
                    this.items[i].fontSize = this.fontSizes[i];
                }
            }
        }
    }
    Draw() {
        var center = this.GetCenter();
        //----------------------------------------//
        //Draw the background
        var tl = center.add(new Vec2(-this.currWidth / 2, this.currHeight / 2));
        var br = center.add(new Vec2(this.currWidth / 2, -this.currHeight / 2));

        Game.renderer.stroke(this.currOutline, this.currOutlineWidth, false, true);
        Game.renderer.fill(this.currBackground);
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