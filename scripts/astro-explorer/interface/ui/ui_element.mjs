//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//UI element class                                                      //
//A base class providing generic UI element functionaliy such as:       //
// - Alignment                                                          //
// - parenting                                                          //
// - base functions                                                     //
//----------------------------------------------------------------------//

import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";


//----------------------------------------------------------------------//
//UIelement class - base class for all UI elements, handles basic variables and logic
export class UIelement {
    constructor(pos, align, width, height) {
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.parent = null;

        this.alignLeft = align.includes('left');
        this.alignRight = align.includes('right');
        this.alignTop = align.includes('top');
        this.alignBottom = align.includes('bottom');
        this.alignCenter = align.includes('center');

        //this.alignment is multiplied by Game.renderer.scaleCnvSize / 2 before being added to this.pos
        //Game.renderer.scaleCnvSize is the size of the virtual canvas. Positions are divided by it, then multiplied by the canvas height.
        this.alignment = new Vec2(0,0);
        if (this.alignLeft) this.alignment.x = -1;
        if (this.alignRight) this.alignment.x = 1;
        if (this.alignTop) this.alignment.y = 1;
        if (this.alignBottom) this.alignment.y = -1;
        if (this.alignCenter) this.alignment = new Vec2(0,0);
    }
    Update() {

    }
    Draw() {

    }

    //Used for when the ui element returns an input value
    GetInput() {
        return 0;
    }

    //----------------------------------------------------------------------//
    //MousedOver(pos)
    //checks whether the mouse is within the bounds of the dropdown IF it was at position 'pos'
    MousedOver(pos) {
        const PREV_POS = new Vec2(this.pos.x, this.pos.y); //To be restored later
        this.pos = new Vec2(pos.x, pos.y);
        const MOUSE_POS = new Vec2(Input.mouseX, Input.mouseY);
        const CENTER = Game.renderer.worldToCanvas(this.GetCenter(), false, true);
        const DELTA = CENTER.sub(MOUSE_POS);
        const X_IN_RANGE = (Math.abs(DELTA.x) < this.width / 2); //Is the mouse X in range?
        const Y_IN_RANGE = (Math.abs(DELTA.y) < this.height / 2);//Is the mouse Y in range?
        this.pos = new Vec2(PREV_POS.x, PREV_POS.y); //Restore pos after calculations
        return (X_IN_RANGE && Y_IN_RANGE);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //GetCenter(pos, alignment)
    //gets the center of the ui element based on the screen alignment and the position relative to that alignment
    //static version
    static GetCenter(pos, alignment) {
        var width = Game.renderer.cnvWidth;
        var height = Game.renderer.cnvHeight;
        
        var scaleCnvSize_half_vec2 = GetScaleSizeHalf(width, height);
        var alignment_mul_scaleCnvSize_half_vec2 = alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(pos); 
        return center;
    }
    
    //local version, relative to parent
    GetCenter() {
        var offset = new Vec2(0,0);
        var scaleCnvSize_half_vec2;
        
        if (this.parent != null) {
            // For child elements
            // Just use relative sizes
            scaleCnvSize_half_vec2 = new Vec2(this.parent.width / 2, this.parent.height / 2);
            offset = this.parent.GetCenter();
        } else {
            // For root elements
            // Use canvas sizes (e.g scale relative to canvas)
            var width = Game.renderer.cnvWidth;
            var height = Game.renderer.cnvHeight;
            scaleCnvSize_half_vec2 = GetScaleSizeHalf(width, height);
        }
        var alignment_mul_scaleCnvSize_half_vec2 = this.alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(this.pos).add(offset); 
        return center;
    }
    //----------------------------------------------------------------------//
}
//END OF UIelement
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Helper functions                                                      //
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//GetScaleSizeHalf()
//When multiplied by an alignment vector (e.g [-1, 0] for left center), this produces coordinates that 
//will - after being transformed by Renderer.worldToCanvas()) - correspond to that side of an object (centered on the canvas) of dimensions 'width' and 'height'
function GetScaleSizeHalf(width, height) {
    return new Vec2(
        
        (width / Game.renderer.cnvHeight)/*Aspect ratio*/ * Game.renderer.scaleCnvSize / Game.renderer.cnvWidth * width, 

        Game.renderer.scaleCnvSize / Game.renderer.cnvHeight * height)

    //Divide by two to get the half size
    .div(2);
}
//----------------------------------------------------------------------//


