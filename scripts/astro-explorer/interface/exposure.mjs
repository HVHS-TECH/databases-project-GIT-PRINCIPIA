//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Exposure.mjs                                                          //
//Exposes functions from different modules to the window                //
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Exposure class - handles exposing functions to the window
export class Exposure {
    //----------------------------------------------------------------------//
    //expose(func)
    //func: a functor
    //name: the name to use
    //exposes 'func' to the window under the name of 'name'
    static expose(func, name) {
        window[name] = func;
    }
    //----------------------------------------------------------------------//
}
//END OF Exposure
//----------------------------------------------------------------------//