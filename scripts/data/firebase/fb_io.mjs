//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//fb_io.mjs                                                             //
//controls reads, writes and listeners to the firebase database         //
//----------------------------------------------------------------------//

import {initializeApp} from 'https://cdn.skypack.dev/@firebase/app';
import {getDatabase, ref, get, set, onValue} from 'https://cdn.skypack.dev/@firebase/database';
import { FB_Data } from './fb_init.mjs';

//----------------------------------------------------------------------//
//functions adapted from my firebase skills repository                  //
//all code is my own                                                    //
//----------------------------------------------------------------------//

//------------------------------------------------------------------------------//
//FB_IO class - handles reads, writes and listeners to the firebase database
export class FB_IO {
    //------------------------------------------------------------------------------//
    //write(path, msg)
    //path: the path to write to
    //key: the key to the message
    //msg: the message to write
    static async write(path, key, msg){
        console.log("FB::write(path, msg)\npath = '" + path + "'\nmsg = " + msg);

        //Avoid writing to database root and deleting everything
        if (path == "/") {
            console.error("FB::write(path, msg) :: attempted to write " + msg + " to the database root.");
            console.warn("FB::write(path, msg) :: attempted to write to database root, aborting");
            return;
        }

        if (key == "") {
            //We are just writing a value to a list
            set(ref(FB_Data.db, path), msg);
            return;
        } else {
            //We are writing a value with an explicitly defined key
            const JSON_STRING = '{"' + key + '": "' + msg + '"}';
            const JSON_OBJECT = JSON.parse(JSON_STRING);
            
            set(ref(FB_Data.db, path + "/" + key), JSON_OBJECT);
        }
        
    }
    //------------------------------------------------------------------------------//


    //Ensure that only one read can happen at a time
    //Stores a boolean specifying if the current path can be read (true = yes)
    static canRead = [];

    //------------------------------------------------------------------------------//
    //read(path, cb)
    static async read(path, cb = ()=>{}) {
        console.log("read(path, cb)\npath = '" + path + "'");

        if (!FB_IO.canRead.includes(path)) {
            FB_IO.canRead[path] = true
        };
        if (!FB_IO.canRead[path]) console.log("read(path, cb) :: waiting for read access");
        while (!FB_IO.canRead[path]){}
        console.log("read(path, cb) :: read access gained");
        FB_IO.canRead[path] = false;
        if (cb.toString() != (()=>{}).toString()) {
            //The user is handling the data
            get(ref(FB_Data.db, path)).then((val)=>{FB_IO.canRead[path] = true; cb(val);});
        } else {
            //We must handle (return) the data
            FB_IO.canRead[path] = true;
            return (await get(ref(FB_Data.db, path))).val(); 
        }
    }
    //------------------------------------------------------------------------------//

    //One unique listener per path
    static listenerPaths = [];
    static listenerCBs = [];

    //------------------------------------------------------------------------------//
    //addWriteListener(path, cb)
    static addWriteListener(path, cb) {
        console.log("fb_addWriteListener(path, cb)\npath = '" + path + "'");

        var isNewPath = false;
        var isNewCb = false;

        if (!FB_IO.listenerPaths.includes(path)) {
            FB_IO.listenerPaths.push(path);
            isNewPath = true;
        }

        //We must use toString to allow for different COPIES (not references) of the same callback code
        if (!FB_IO.listenerCBs.includes(cb.toString())) {
            FB_IO.listenerCBs.push(cb.toString());
            isNewCb = true;
        }
        if (!isNewPath && !isNewCb) {
            //The exact same write listener (same path, same callback) already exists
            console.error("fb_addWriteListener(path, cb) :: there is already a write listener at path '" + path + "' with the callback: " + cb.toString());
            console.warn("fb_addWriteListener(path, cb) :: attempted to add a duplicate write listener, aborting.");
            return;
        }
        
        onValue(ref(FB_Data.db, path), cb);
    }
    //------------------------------------------------------------------------------//
}
//END OF FB_IO
//------------------------------------------------------------------------------//

