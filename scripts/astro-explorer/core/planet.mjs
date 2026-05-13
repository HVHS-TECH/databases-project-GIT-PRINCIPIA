//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Planet class                                                          //
//An object to represent a planet, handling rendering and update logic  //
//Also contains mountain class,                                         //
//ocean class,                                                          //
//planet colours class                                                  //
//(for cleanliness)                                                     //
//----------------------------------------------------------------------//
import {Colour, Vec2, DEG2RAD, normalizeAngle} from "../../utility/miscellaneous.mjs";
import { Renderer } from './renderer.mjs';
import { Game } from './game.mjs';
import { Player } from './player.mjs';
import { Time } from '../../utility/time.mjs';

//----------------------------------------------------------------------//
//Ring class
//data structure for a planet's ring
export class Ring {
    constructor(startRad, endRad, density, colour) {
        this.startRad = startRad;
        this.endRad = endRad;
        this.density = density;
        this.colour = Colour.rgba(colour.r, colour.g, colour.b, density);
    }
}
//END OF Ring
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Mountain class
//Simple data structure to store mountain data
export class Mountain {
    constructor(rad, width, height) {
        this.rad = rad;
        this.width = width;
        this.height = height;
    }
}
//END OF Mountain
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Ocean class
//Simple data structure to store ocean data
export class Ocean {
    constructor(chunk, depth) {
        this.chunk = chunk;
        this.depth = depth;
    }
}
//END OF Ocean
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet surface class
//Land colours
//Land data
//Land features
//Helps to simplify planet contructor and readability
export class PlanetSurface {
    constructor(colour, outlineColour, innerColour, mantleColour, outerCoreColour, innerCoreColour, mountainColour, snowColour, mountainOutlineColour, mountains) {
        
        //Planet colours
        this.colour = colour;
        this.outlineColour = outlineColour;
        this.innerColour = innerColour;
        this.mantleColour = mantleColour;
        this.outerCoreColour = outerCoreColour;
        this.innerCoreColour = innerCoreColour;


        //Mountains
        this.mountainColour = mountainColour;
        this.snowColour = snowColour;
        this.mountainOutlineColour = mountainOutlineColour;
        this.mountains = mountains;
    }   
}
//END OF PlanetSurface
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet oceans class
//Ocean colours
//Ocean data
export class PlanetOceans {
    constructor(oceanColourShallow, oceanColourDeep, oceans) {
        //Oceans
        this.oceanColourShallow = oceanColourShallow;
        this.oceanColourDeep = oceanColourDeep;
        this.oceans = oceans;
    }
}
//END OF PlanetOceans
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet data class
//Radius
//Mass
//Position
//Velocity
//Name
//Reference body
export class PlanetData {
    constructor(name, pos, vel, radius, mass, referenceBodyNames) {
        //Base data
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.mass = mass;
        
        //Orbit
        this.referenceBodyNames = referenceBodyNames; //The planets that can apply forces to this



        //Discovered
        this.discovered = false;
    }
}
//END OF PlanetData
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet atmosphere class
//Atmosphere radius
//Atmosphere colours
//Atmosphere density
export class PlanetAtmosphere {
    constructor(seaLvlRadius, radius, seaLvlDensity, atmoColourLow, atmoColourMid) {
        this.seaLvlRadius = seaLvlRadius; //Bottom
        this.radius = radius; //Top
        this.seaLvlDensity = seaLvlDensity; //Atmosphere density at sea level

        //Atmosphere colours
        this.atmoColourLow = atmoColourLow;
        this.atmoColourMid = atmoColourMid;
    }
}
//END OF PlanetAtmosphere
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Planet rings class
//Holds all of the planet's rings
export class PlanetRings {
    constructor(rings) {
        this.rings = rings;
    }
}
//END OF PlanetRings
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet class
export class Planet {
    static GROUND_STROKE_WIDTH = 2; //Width of ground outline
    static MOUNTAIN_STROKE_WIDTH = 3; //Width of mountain outline
    static LOCATOR_RADIUS_RAD_MUL = 6; //Locator radius = <LOCATOR_RADIUS_RAD_MUL> * this.data.radius

    constructor(data, land, ocean, atmosphere, rings) {
        this.data = data;
        this.land = land;
        this.ocean = ocean;
        this.atmosphere = atmosphere;
        this.rings = rings;
    }

    //----------------------------------------------------------------------//
    //Update(dt)
    //Called every frame with (scaled) delta time dt
    Update(dt, planets) {
        for (var i = 0; i < this.data.referenceBodyNames.length; i++) {
            const NAME = this.data.referenceBodyNames[i];
            if (NAME == "none") continue; //don't apply gravity from no planet
            var other = null;
            for(var p = 0; p < planets.length; p++) {
                if (planets[p].data.name == NAME) {
                    other = planets[p];
                    break;
                }
            }
            if (other == null) {
                console.error("Planet.Update() : could not find reference body '" + NAME + "' in list of planets:");
                console.dir(planets); //Log the list of planets
                return;
            }
            const DELTA = other.data.pos.sub(this.data.pos);
            const DELTA_NORM = DELTA.norm();
            const DIST_SQUARED = DELTA.sqrMag();

            const ACCEL = Game.G * other.data.mass / (DIST_SQUARED) * dt * 0.5; //0.5 for verlet integration
            this.data.vel = this.data.vel.add(DELTA_NORM.mul(ACCEL));
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Integrate(dt)
    //integrate the planet's postiion with (scaled) delta time dt
    Integrate(dt) {
        //Integrate postiion based on velocity and delta time
        this.data.pos = this.data.pos.add(this.data.vel.mul(dt));
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the planet and its features (atmosphere etc)
    Draw() {
        //Layered from back to front
        //console.log("Name: " + this.data.name);
        //console.dir(this.data.pos);
        if (this.atmosphere != null) this.DrawAtmosphere();
        
        if (this.land != null) {
            this.DrawMountains();
            this.DrawGround();
            this.DrawGroundOutline();
        }

        if (this.ocean != null) this.DrawOceans();

        if (this.rings != null) this.DrawRings();

        this.DrawLocatorOutline();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawRings()
    //draws the planet's rings
    DrawRings() {
        for (var r = 0; r < this.rings.rings.length; r++) {
            const THICKNESS = this.rings.rings[r].endRad - this.rings.rings[r].startRad;
            Game.renderer.stroke(this.rings.rings[r].colour, THICKNESS, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(this.data.pos, this.rings.rings[r].startRad + THICKNESS / 2, 0, Math.PI * 2, true, true);
            Game.renderer.strokeShape();
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawLocatorOutline()
    //draws a circle around the planet showing where it is
    DrawLocatorOutline() {
        const DISCOVERED_COLOUR = Colour.rgba(0, 255, 38, 0.5);
        const UNDISCOVERED_COLOUR = Colour.rgba(183, 100, 200, 0.5);
        const OUTLINE_COLOUR = (this.data.discovered) ? DISCOVERED_COLOUR : UNDISCOVERED_COLOUR;

        Game.renderer.stroke(OUTLINE_COLOUR, 2, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(this.data.pos, this.data.radius * Planet.LOCATOR_RADIUS_RAD_MUL, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();


        //Also draw the name of the planet
        const FONT_SIZE = this.data.radius * 1;


        //Rotate the position to be always at the SCREEN-SPACE bottom of the planet's outline
        const OFFSET = new Vec2(0, -this.data.radius * Planet.LOCATOR_RADIUS_RAD_MUL + FONT_SIZE / 2); //Slightly inside the outline
        const ROTATED_OFFSET = Vec2.rotatePoint(OFFSET, -Player.smoothDir);
        const POS = this.data.pos.add(ROTATED_OFFSET);

        const TEXT = this.data.name.toUpperCase();
        const MIN_DIST_2_PLAYER = FONT_SIZE * TEXT.length / 3; //Long planet names need the player to be further away

        //Only draw if the text wont get in the way of the player's vision
        if (Vec2.dist(POS, Player.pos) > MIN_DIST_2_PLAYER) {
            Game.renderer.fill(OUTLINE_COLOUR);
            Game.renderer.text(
                TEXT,
                'center', 'middle',
                FONT_SIZE, 'monospace',
                POS,
                true, true
            );
        }
        
        
    }
    //----------------------------------------------------------------------//


    
    //----------------------------------------------------------------------//
    //DrawGroundOutline()
    //Draws an outline around the planet
    DrawGroundOutline() {
        Game.renderer.stroke(this.land.outlineColour, Planet.GROUND_STROKE_WIDTH, true, true);
        Game.renderer.beginPath();
        Game.renderer.arc(this.data.pos, this.data.radius - Planet.GROUND_STROKE_WIDTH / 2, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawGround()
    //Draws the planet surface and interior 
    DrawGround() {
        //Draw planet ground
        var groundGrad = Game.renderer.radGradient(this.data.pos, this.data.pos, 0, this.data.radius, true, true);

        groundGrad.addColorStop(0.2, this.land.innerCoreColour.txt());
        groundGrad.addColorStop(0.4, this.land.outerCoreColour.txt());
        groundGrad.addColorStop(0.7, this.land.mantleColour.txt());
        groundGrad.addColorStop(0.8, this.land.mantleColour.txt());
        groundGrad.addColorStop(0.98, this.land.innerColour.txt());
        groundGrad.addColorStop(0.99, this.land.colour.txt());
        groundGrad.addColorStop(1, this.land.colour.txt());

        Game.renderer.fill(groundGrad);
        
        Game.renderer.beginPath();
        Game.renderer.arc(this.data.pos, this.data.radius - Planet.GROUND_STROKE_WIDTH / 2, 0, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawAtmosphere()
    //Draws the atmosphere of the planet
    DrawAtmosphere() {
        //Draw planet atmosphere
        var atmoGrad = Game.renderer.radGradient(this.data.pos, this.data.pos, this.atmosphere.seaLvlRadius, this.atmosphere.radius, true, true);

        
        atmoGrad.addColorStop(0, this.atmosphere.atmoColourLow.txt());
        atmoGrad.addColorStop(0.3, this.atmosphere.atmoColourMid.txt());
        atmoGrad.addColorStop(0.9, 'transparent');

        Game.renderer.fill(atmoGrad);
        Game.renderer.beginPath();
        Game.renderer.arc(this.data.pos, this.atmosphere.radius, 0, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawMountains()
    //Draws the mountains on the planet
    DrawMountains() {
        const FUDGE_FACTOR = 5; //Fudge factor to shift the mountain into the ground
        var mountainGrad = Game.renderer.radGradient(this.data.pos, this.data.pos, this.data.radius, this.data.radius * 1.4, true, true);
        mountainGrad.addColorStop(0, this.land.mountainColour.txt());
        mountainGrad.addColorStop(0.28, this.land.mountainColour.txt());
        mountainGrad.addColorStop(0.3, this.land.snowColour.txt());
        mountainGrad.addColorStop(1, this.land.snowColour.txt());
        Game.renderer.fill(mountainGrad);
        Game.renderer.stroke(this.land.mountainOutlineColour, Planet.MOUNTAIN_STROKE_WIDTH, true, true);
        const CIRCUMFERENCE = 2 * Math.PI * this.data.radius;
        //Loop through all the mountains and draw them
        for (var m = 0; m < this.land.mountains.length; m++) {
            const MOUNTAIN = this.land.mountains[m];

            //                ^
            //               / \
            //              /   \
            //             /     \
            //            /       \
            //           /         \
            //          /           \
            //         /             \
            //      __/__-----------__\__
            // __--- /_________________\ ---__
            //-                               -
            //
            //
            //
            //
            //
            //
            //
            //
            //
            //
            //                {} <- planet center
            //
            //
            //
            const SIDE_ANGLE = MOUNTAIN.width / CIRCUMFERENCE * 500 * DEG2RAD; // MOUNTAIN.width / 5 to get units => degrees, then convert to radians
            const SIDE_ANGLE_HALF = SIDE_ANGLE / 2;

            const LEFT = new Vec2(
                Math.sin(MOUNTAIN.rad - SIDE_ANGLE_HALF / 2) * (this.data.radius - FUDGE_FACTOR),
                Math.cos(MOUNTAIN.rad - SIDE_ANGLE_HALF / 2) * (this.data.radius - FUDGE_FACTOR)
            );

            const RIGHT = new Vec2(
                Math.sin(MOUNTAIN.rad + SIDE_ANGLE_HALF / 2) * (this.data.radius - FUDGE_FACTOR),
                Math.cos(MOUNTAIN.rad + SIDE_ANGLE_HALF / 2) * (this.data.radius - FUDGE_FACTOR)
            );

            const TOP_DIST = MOUNTAIN.height + this.data.radius;

            const TOP = new Vec2(
                Math.sin(MOUNTAIN.rad) * TOP_DIST, 
                Math.cos(MOUNTAIN.rad) * TOP_DIST
            );
            const VERTICES = [TOP.add(this.data.pos), RIGHT.add(this.data.pos), LEFT.add(this.data.pos)];
            Game.renderer.drawPolygon(VERTICES, true, true);
            Game.renderer.fillShape();
            Game.renderer.strokeShape();
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawOceans()
    //Draws the oceans of the planet
    DrawOceans() {
        var oceanGrad = Game.renderer.radGradient(this.data.pos, this.data.pos, 0, this.data.radius, true, true);
        oceanGrad.addColorStop(0, this.ocean.oceanColourDeep.txt());
        oceanGrad.addColorStop(0.97, this.ocean.oceanColourDeep.txt());
        oceanGrad.addColorStop(0.995, this.ocean.oceanColourShallow.txt());
        oceanGrad.addColorStop(1, this.ocean.oceanColourShallow.txt());
        
        //Loop through all the mountains and draw them
        for (var o = 0; o < this.ocean.oceans.length;o++) {
            const OCEAN = this.ocean.oceans[o];
            const CHUNK_WIDTH = 15;
            const LEFT = (OCEAN.chunk * CHUNK_WIDTH - CHUNK_WIDTH / 2) * DEG2RAD;
            const RIGHT = (OCEAN.chunk * CHUNK_WIDTH + CHUNK_WIDTH / 2) * DEG2RAD;
            Game.renderer.stroke(oceanGrad, OCEAN.depth, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(this.data.pos, this.data.radius - OCEAN.depth / 2, LEFT, RIGHT, true, true);
            Game.renderer.strokeShape();
        }
    }
    //----------------------------------------------------------------------//
}
//END OF Planet
//----------------------------------------------------------------------//