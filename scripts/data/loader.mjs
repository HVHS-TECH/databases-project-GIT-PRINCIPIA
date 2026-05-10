//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Loader class                                                          //
//Manages loading planets, etc                                          //
//----------------------------------------------------------------------//
import { Planet, Mountain, Ocean, PlanetData, PlanetSurface, PlanetOceans, PlanetAtmosphere, Ring, PlanetRings } from "../core/planet.mjs"
import { Player } from "../core/player.mjs";
import { Vec2, Colour } from "../utility/miscellaneous.mjs";
//Loader class, 
export class Loader {

    //----------------------------------------------------------------------//
    //LoadPlanets()
    //Returns a list of planet objects
    static LoadPlanets() {
        //Since js cannot list the files in a directory, we must store the paths in one file
        const PLANET_REFERENCES_JSON = Loader.GetJSONobject('../gamedata/planets/references.json'); 
        const PLANET_REFERENCES_JSON_LIST = PLANET_REFERENCES_JSON.planets;
        const STARTING_PLANET_NAME = PLANET_REFERENCES_JSON.starting_body;

        
        
        var ret = [];
        //Load all the planets from the planets list 'PLANET_REFERENCES_JSON_LIST'
        for (var i = 0; i < PLANET_REFERENCES_JSON_LIST.length; i++) {
            const PATH = "../gamedata/planets/" + PLANET_REFERENCES_JSON_LIST[i];
            const JSON_OBJECT = Loader.GetJSONobject(PATH);
            const PLANET = Loader.JSONobjectToPlanet(JSON_OBJECT);
            if (PLANET == null) {
                //The loader has failed to load the planet
                //Log an error message
                console.error("Loader.LoadPlanets() : Failed to load planet from path '" + PATH + "'");
            } else {
                //Only add valid planets to the list
                ret.push(PLANET);
            }
            
        }

        //Loop through all the planets, and set the player's starting position
        for (var i = 0; i < ret.length; i++) {
            if (ret[i].data.name == STARTING_PLANET_NAME) {
                Player.pos = ret[i].data.pos.add(new Vec2(0, ret[i].data.radius));
                Player.vel = ret[i].data.vel;
                ret[i].data.discovered = true;
                console.log("Player starting position set to be on '" + STARTING_PLANET_NAME + "'");
                break;
            }
        }
        console.log("Loader.LoadPlanets: loaded planet array: ");
        console.dir(ret); //Debug
        return ret;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //JSONobjectToPlanet(jsonObject)
    //Returns a planet generated from jsonObject
    static JSONobjectToPlanet(jsonObject) {

        //----------------------------------------//
        if (jsonObject.data == null) {
            //Planet does not have the required data to exist
            //Cancel loading planet
            //Error message will be generated in LoadPlanets() - which has the file path for debugging
            return null; 
        }
        const DATA = new PlanetData(
            jsonObject.data.name, 
            new Vec2(jsonObject.data.x, jsonObject.data.y),  //Position
            new Vec2(jsonObject.data.xVel, jsonObject.data.yVel), //Velocity
            jsonObject.data.radius,
            jsonObject.data.mass, 
            jsonObject.data.referenceBodyNames //The planets that can gravitationally affect this planet
        );
        //----------------------------------------//
        
        
        //----------------------------------------//
        var land = null;
        if (jsonObject.land != null) {
            //The planet has a surface

            //Mountains array
            const MOUNTAINS = [];

            //Loop through all JSON mountains, convert to mountain class, add to MOUNTAINS array
            for (var i = 0; i < jsonObject.land.mountains.length; i++) {
                const MOUNTAIN = new Mountain(jsonObject.land.mountains[i].rad, jsonObject.land.mountains[i].width, jsonObject.land.mountains[i].height);
                MOUNTAINS.push(MOUNTAIN);
            }

            land = new PlanetSurface(
                Colour.rgb(jsonObject.land.colour.r, jsonObject.land.colour.g, jsonObject.land.colour.b), //Ground colour
                Colour.rgb(jsonObject.land.outlineColour.r, jsonObject.land.outlineColour.g, jsonObject.land.outlineColour.b), //Outline colour
                Colour.rgb(jsonObject.land.innerColour.r, jsonObject.land.innerColour.g, jsonObject.land.innerColour.b), //Dirt colour
                Colour.rgb(jsonObject.land.mantleColour.r, jsonObject.land.mantleColour.g, jsonObject.land.mantleColour.b), //Mantle colour
                Colour.rgb(jsonObject.land.outerCoreColour.r, jsonObject.land.outerCoreColour.g, jsonObject.land.outerCoreColour.b), //Outer core colour
                Colour.rgb(jsonObject.land.innerCoreColour.r, jsonObject.land.innerCoreColour.g, jsonObject.land.innerCoreColour.b), //Inner core colour
                Colour.rgb(jsonObject.land.mountainColour.r, jsonObject.land.mountainColour.g, jsonObject.land.mountainColour.b), //Mountain colour
                Colour.rgb(jsonObject.land.snowColour.r, jsonObject.land.snowColour.g, jsonObject.land.snowColour.b), //Snow colour
                Colour.rgb(jsonObject.land.mountainOutlineColour.r, jsonObject.land.mountainOutlineColour.g, jsonObject.land.mountainOutlineColour.b), //Outline colour of the mountains
                MOUNTAINS, //Mountains list (list of Mountain classes)
            );
        } else {
            console.warn("Planet '" + DATA.name + "' does not have a surface. \n" + 
                        "This may or may not be intentional.");
        }
        
        //----------------------------------------//


        //----------------------------------------//
        var ocean = null;
        if (jsonObject.ocean != null) {
            //The planet has an ocean

            //Oceans array
            const OCEANS = [];

            
            //Loop through all JSON oceans, convert to ocean class, add to OCEANS array
            for (var i = 0; i < jsonObject.ocean.oceans.length; i++) {
                const OCEAN = new Ocean(jsonObject.ocean.oceans[i].chunk, jsonObject.ocean.oceans[i].depth);
                OCEANS.push(OCEAN);
            }
            
            ocean = new PlanetOceans(
                Colour.rgb(jsonObject.ocean.oceanColourShallow.r, jsonObject.ocean.oceanColourShallow.g, jsonObject.ocean.oceanColourShallow.b), //Top ocean colour
                Colour.rgb(jsonObject.ocean.oceanColourDeep.r, jsonObject.ocean.oceanColourDeep.g, jsonObject.ocean.oceanColourDeep.b), //Deep ocean colour
                OCEANS //Oceans list (list of Ocean classes)
            );
        }
        
        //----------------------------------------//


        //----------------------------------------//
        var atmosphere = null;
        if (jsonObject.atmosphere != null) {
            //The planet has an atmosphere

            atmosphere = new PlanetAtmosphere(
                jsonObject.atmosphere.seaLvlRadius, //bottom of atmosphere
                jsonObject.atmosphere.atmoRadius, //Top of atmosphere
                jsonObject.atmosphere.density, //At sea level
                Colour.rgb(jsonObject.atmosphere.atmoColourLow.r, jsonObject.atmosphere.atmoColourLow.g, jsonObject.atmosphere.atmoColourLow.b),
                Colour.rgb(jsonObject.atmosphere.atmoColourMid.r, jsonObject.atmosphere.atmoColourMid.g, jsonObject.atmosphere.atmoColourMid.b)
            );
        }
        
        //----------------------------------------//
        
        //----------------------------------------//
        var ring = null;
        if (jsonObject.ring != null) {
            //The planet has rings
            const RINGS = [];
            for (var i = 0; i < jsonObject.ring.rings.length; i++) {
                const RING = new Ring(
                    jsonObject.ring.rings[i].startRad, jsonObject.ring.rings[i].endRad, jsonObject.ring.rings[i].density, //Opacity
                    Colour.rgb(jsonObject.ring.rings[i].colour.r, jsonObject.ring.rings[i].colour.g, jsonObject.ring.rings[i].colour.b)
                );
                RINGS.push(RING);
            }
            ring = new PlanetRings(RINGS);
        }
        //----------------------------------------//

        return new Planet(
            DATA, land, ocean, atmosphere, ring
        );
    }

    //----------------------------------------------------------------------//
    //GetJSONobject(path)
    //Returns the JSON object in the file at path
    static GetJSONobject(path) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, false); // false = synchronous
        xhr.send(null);
        const fileContents = xhr.responseText;

        return JSON.parse(fileContents);
    }
    //----------------------------------------------------------------------//
}

