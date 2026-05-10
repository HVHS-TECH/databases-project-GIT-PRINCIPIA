//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Dropdown class                                                        //
//A class that represents a dropdown, with basic functionality such as: //
// - Toggling the 'dropped-down' status                                 //
// - Smooth interpolation of position                                   //
// - The ability to store (one) item inside it that moves along with it //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";


//----------------------------------------------------------------------//
//dropdown class, used for things like notifications, such
export class Dropdown extends UIelement {
    static dropdownTimeout = 300; //<dropdownTimeout> ms between dropdowns
    //Trigger element: the ui element that displays where the dropdown is e.g an arrow icon, etc
    //container: the container class that this dropdown 'drops down'.
    constructor(pos, align, width, height, dropdownDist, dropdownState, dropdownTime, triggerFunc, container) {
        super(pos, align, width, height);
        this.raisedPos = pos;
        this.loweredPos = pos.sub(new Vec2(0, dropdownDist));

        this.dropdownDist = dropdownDist;
        this.dropdownTime = dropdownTime;

        this.CheckToToggle = triggerFunc;
        this.container = container;
        if (this.container != null) this.container.parent = this;

        
        this.timeSinceLastDroppedDown = 0;
        
        this.targetDropdownValue = dropdownState;
        this.t = dropdownState; //For interpolation
        this.startDropdownState = dropdownState; //Used in game.restart to reset dropdowns
    }
    

    //----------------------------------------------------------------------//
    //ToggleDroppedDown()
    //check if the cooldown permits toggling, and if so, toggle the target value for interpolation in Update()
    ToggleDroppedDown() {
        if (this.timeSinceLastDroppedDown < Dropdown.dropdownTimeout / 1000) {
            return;
        }
        this.timeSinceLastDroppedDown = 0;

        //Toggle dropdown status
        this.targetDropdownValue = 1 - this.targetDropdownValue;

    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //CheckToToggle()
    //User defined, set in constructor
    CheckToToggle() {

    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //Update()
    //Check whether the dropdown should toggle, and lerp to the target position
    //Also update associated container object
    Update() {
        this.CheckToToggle();
        this.timeSinceLastDroppedDown += Time.deltaTime;
        this.pos = Vec2.lerp(this.raisedPos, this.loweredPos, this.t);
        if (this.container != null) {
            this.container.parent = this;
            this.container.Update();
        }
        this.t = lerp(this.t, this.targetDropdownValue, 1 / this.dropdownTime * Time.scaleDeltaTime / (Math.abs(this.targetDropdownValue - this.t) + 1/*+1 to avoid divide by zero*/) * 2)
        this.t = clamp(this.t, 0, 1);
    }
    //----------------------------------------------------------------------//

    

    //----------------------------------------------------------------------//
    //Draw()
    //Draw the container associated with the dropdown
    Draw() {
        if (this.container != null) {
            this.container.Draw();
        }
    }
    //----------------------------------------------------------------------//
}
//----------------------------------------------------------------------//