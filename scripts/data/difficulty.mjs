//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Difficulty state class                                                //
//A whole bunch of constants around difficulty, such as how tolerant the//
//player's spaceship is to impacts.                                     //
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Difficulty class - handles constants relating to difficulty
export class Difficulty {
    static Player = {
        //Impacts
        IMPACT_TOLERANCE: 1.1,
        IMPACT_FATALITY_DIRECTION_COMPONENT: 10, //How severe not being upright on impacts is
        
        //Reentry
        REENTRY_TOLERANCE: 0.1,

        //Fuel
        MAX_FUEL: 320,
        FUEL_USED_PER_FRAME: 0.1,
        THRUSTER_FORCE: 0.005
    };
}
//END OF Difficulty
//----------------------------------------------------------------------//