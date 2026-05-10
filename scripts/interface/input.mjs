//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Input class                                                           //
//Manages input callbacks                                               //
//----------------------------------------------------------------------//

export class Input {
    static mouseX;
    static mouseY;
    static keysDown = [];
    static mouseDown = false;

    //----------------------------------------------------------------------//
    //Initialize()
    //Initializes the callbacks
    static Initialize() {
        document.addEventListener('keydown', function(event) {
            Input.keysDown[event.code] = true;
        });

        document.addEventListener('keyup', function(event) {
            Input.keysDown[event.code] = false;
        });
        document.onmousemove = function(evt){Input.mouseX = evt.pageX; Input.mouseY = evt.pageY;};

        document.addEventListener("mousedown", function(event){Input.mouseDown = true});
        document.addEventListener("mouseup", function(event){Input.mouseDown = false});
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //KeyDown(keyName)
    //return whether or not the key 'keyName' is pressed
    static KeyDown(keyName) {
        // keyName should match event.code, e.g. "KeyA", "ArrowUp", "Space"
        return (!!Input.keysDown[keyName]) ? 1 : 0;
    }
    //----------------------------------------------------------------------//
}
