//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//event.mjs                                                             //
//Handles multiple callbacks per event                                  //
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Event class - handles multiple callbacks per event
export class CustomEvent {
    static empty = new CustomEvent();
    constructor(...callbacks) {
        this.callbacks = callbacks;
    }

    //----------------------------------------------------------------------//
    //subscribe(cb)
    subscribe(cb) {
        this.callbacks.push(cb);
        return cb;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //unsubscribe(id)
    //Where id is returned from 'subscribe' - and is actually the cb!
    unsubscribe(id) {
        this.callbacks[id] = ()=>{}; //I don't really want to remove it from the array... this works fine
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //run()
    //runs the event
    run() {
        for (var i = 0; i < this.callbacks.length; i++) {
            (this.callbacks[i])();
        }
    }
    //----------------------------------------------------------------------//

}
//END OF Event
//----------------------------------------------------------------------//


