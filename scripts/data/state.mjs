//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//state class                                                           //
//a class that allows for saving game states and such, such as:         //
// - the reason the player died (for the end screen)                    //
// - the score                                                          //
// - the high score                                                     //
//----------------------------------------------------------------------//
export class State {
    static debugMode = false;
    static updatePlayer = true;
    //----------------------------------------------------------------------//
    //getState(name)
    //get the stored state under name 'name'
    static getState(name) {
        return localStorage.getItem(name);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //setState(name, value)
    //set the stored state under name 'name' to value 'value'
    static setState(name, value) {
        localStorage.setItem(name, value);
    }
    //----------------------------------------------------------------------//
}