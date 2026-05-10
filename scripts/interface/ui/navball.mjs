//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Navball class                                                         //
//A circle at the bottom of the screen displaying information such as:  //
//                                                                      //
// - The player's rotation, rendered as an enlarged version of the      //
//   player                                                             //
//                                                                      //
// - The player's velocity, rendered as a circular meter around the rim //
//                                                                      //
// - The player's direction of movement, rendered as 'wind streaks'     //
//                                                                      //
// - The closest planet, rendered as text denoting its name and distance//
//                                                                      //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";
import { Colour } from "../../utility/miscellaneous.mjs";


//----------------------------------------------------------------------//
//Navball, displays a copy of the player, and information such as their velocity, velocity direction, closest planet, etc
export class Navball extends UIelement {
    constructor(pos, align, radius, 
        playerColour, backgroundColour, backgroundColourOuter, windStreakColour, textColour, outlineColour, 
        outlineWidth, textSize, font, velRefName, velDirRefName
    ) {
        super(pos, align, radius * 2, radius * 2);
        this.radius = radius;
        this.playerColour = playerColour;
        this.backgroundColour = backgroundColour;
        this.backgroundColourOuter = backgroundColourOuter;
        this.windStreakColour = windStreakColour;
        this.textColour = textColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
        this.textSize = textSize;
        this.font = font;
        this.vel = 0;
        this.velDir = 0;
        this.playerScale = 20;
        this.playerVelScale = this.radius;
        this.velDirRefName = velDirRefName;
        this.velRefName = velRefName;
        this.frame = 100000;

        this.closestPlanetDist = 0;
        this.closestPlanetRelVel = 0;
    }

    //----------------------------------------------------------------------//
    //Update()
    //Called every frame
    //Updates the velocity magnitude and velocity direction references
    Update() {
        this.vel = Game.getRefVar(this.velRefName);
        this.velDir = Game.getRefVar(this.velDirRefName);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the Navball
    Draw() {
        var center = this.GetCenter();

        this.DrawBackground(center);

        this.DrawWindStreaks(center);

        this.DrawPlayer(center);

        this.DrawOutline(center);

        this.DrawText(center);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawBackground(center)
    //Draws the background circle of the navball
    DrawBackground(center) {
        //----------------------------------------//
        //Draw the background
        var gradient = Game.renderer.radGradient(center, center, 0, this.radius, false, true);
        gradient.addColorStop(0.4, this.backgroundColour.txt()); //Starts at 0.4 because the player takes up (some) space in the middle
        gradient.addColorStop(1, this.backgroundColourOuter.txt());
        Game.renderer.fill(gradient);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, 0, Math.PI * 2, false, true);
        Game.renderer.fillShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawWindStreaks()
    //Draws the 'wind streaks' indicating the player velocity direction
    DrawWindStreaks(center) {
        //----------------------------------------//
        //Settings, could be moved to constructor
        const SPACING = 250; //Spacing between wind streaks
        const SIZE = 100; //Length of wind streaks
        const NUM_LINES = 20; //Number of lines across the navball - some are skipped
        //----------------------------------------//

        //----------------------------------------//
        //Populate lineDashArray
        const LENGTH = Math.ceil(this.radius / (SPACING + SIZE)); //Length of array
        var lineDashArray = [];
        for (var i = 0; i < LENGTH; i++) {
            lineDashArray.push(SIZE);
            lineDashArray.push(SPACING);
        }
        //----------------------------------------//

        //----------------------------------------//
        //Draw the lines
        for (var l = -this.radius; l <= this.radius; l += this.radius * 2 / (NUM_LINES * 0.4)) {
            const widthHalf = Math.sqrt(this.radius * this.radius - l * l);
            var p1 = new Vec2(-widthHalf, l);
            var p2 = new Vec2(widthHalf, l);

            //Rotate p1 and p2 by slope around center
            p1 = p1.rotate(this.velDir - Player.smoothDir);
            p2 = p2.rotate(this.velDir - Player.smoothDir);

            p1 = p1.add(center);
            p2 = p2.add(center);

            //----------------------------------------//
            //Spread out the equation into smaller chunks
            const A = (SPACING + SIZE) / SPACING
            const TIME = (this.frame) + Math.sin(l / 10 + this.frame / 200000) * 34000 - Math.cos(l / 20 + this.frame / 200000) * 3000;
            const MODULUS = TIME % (A * SPACING / SIZE);
            //----------------------------------------//

            //----------------------------------------//
            //Populate start of array with segments that grow in length to imitate movement
            var lineDashArrayStart = [ 
                clamp((MODULUS) * SIZE - SPACING, 0, SIZE), //SIZE
                clamp((MODULUS) / (SPACING / SIZE) * SPACING, 0, SPACING) //SPACING
                    ];
            //----------------------------------------//

            //Add the rest of the array on the end
            lineDashArrayStart.push(...lineDashArray);

            //----------------------------------------//
            //Render the line

            //Don't let the width get too small or large
            const WIDTH = clamp(this.radius * 2 / (NUM_LINES * 2), 
                3, //Min size
                10 //Max size
            );
            
            Game.renderer.lineDash(lineDashArrayStart, false, true);

            //Draw the 'shadow'
            const SHADOW_DEPTH = 5;
            const SHADOW_P1 = p1.sub(new Vec2(0, SHADOW_DEPTH));
            const SHADOW_P2 = p2.sub(new Vec2(0, SHADOW_DEPTH));
            Game.renderer.stroke(Colour.lerp(this.windStreakColour, Colour.rgb(0,0,0), 0.7), WIDTH, false, true);
            Game.renderer.beginPath();
            Game.renderer.line(SHADOW_P1, SHADOW_P2, false, true); 
            Game.renderer.strokeShape();


            //Draw the line
            Game.renderer.stroke(this.windStreakColour, WIDTH, false, true);
            Game.renderer.beginPath();
            Game.renderer.line(p1, p2, false, true); 
            Game.renderer.strokeShape();

            

            //Reset line dash
            Game.renderer.lineDash([]);
            //----------------------------------------//
        }
        //----------------------------------------//

        const SPEED_MUL = 0.15;
        this.frame += this.vel * SPEED_MUL * Time.scaleDeltaTime;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //DrawPlayer(center)
    //Draw the player in the navball's center
    DrawPlayer(center) {
        //----------------------------------------//
        //Draw the player at an enlarged size
        Player.drawPlayer(center, this.playerScale, false, true, true);
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //DrawOutline(center)
    //Draw an outline around the navball
    DrawOutline(center) {
        //----------------------------------------//
        //Draw the background outline last
        Game.renderer.stroke(this.outlineColour, this.outlineWidth, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, 0, Math.PI * 2, false, true);
        Game.renderer.closePath();
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Draw an overlay pointing to the nearest planet (use player.smoothDir)
        const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
        const CLOSEST = Game.PLANETS[CLOSEST_IDX];
        const DELTA = CLOSEST.data.pos.sub(Player.pos);
        if (CLOSEST.land != null) {
            const COLOUR = CLOSEST.land.mantleColour;
            Game.renderer.stroke(COLOUR, this.outlineWidth, false, true);
            Game.renderer.beginPath();
            Game.renderer.arc(center, this.radius, DELTA.dir() - Player.smoothDir, DELTA.dir() - Player.smoothDir + Math.PI, false, true);
            Game.renderer.strokeShape();
        }
        
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawText(center)
    //Draw nearest planet name text
    //Draw nearest planet discovered boolean value text
    //Draw nearest planet distance
    //Draw nearest planet relative speed
    DrawText(center) {
        //----------------------------------------//
        //Update text
        //----------------------------------------//
        const DISTANCE_UNITS = "m";
        const DISTANCE_SCALE = 1; //To make it match the units sensibly


        const DECIMAL_PLACES = 2;
        const TEN_POW_DECIMAL_PLACES = Math.pow(10, DECIMAL_PLACES);

        const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
        const CLOSEST_PLANET = Game.PLANETS[CLOSEST_IDX];

        var textRight = "";
        var textLeft = "";
        
        //----------------------------------------//
        //Nearest planet name
        textLeft += "Closest planet: '" + CLOSEST_PLANET.data.name + "'\n";
        //----------------------------------------//

        //----------------------------------------//
        //Nearest planet is discovered?
        if (CLOSEST_PLANET.data.discovered) {
            //Planet has been discovered already
            textLeft += "Discovered!\n";
        } else {
            //Planet has not yet been discovered
            textLeft += "Not yet discovered!\n";
        }
        //----------------------------------------//

        const FREQUENCY = 1;
        if (Time.frame % 10 == FREQUENCY) {
            //----------------------------------------//
            //Update distance and rel vel 
            //----------------------------------------//
            


            //----------------------------------------//
            //Nearest planet distance
            const DIST = Vec2.dist(CLOSEST_PLANET.data.pos, Player.pos) - CLOSEST_PLANET.data.radius - Player.HEIGHT / 2;
            const ROUNDED_DIST = Math.round(DIST * DISTANCE_SCALE * TEN_POW_DECIMAL_PLACES) / TEN_POW_DECIMAL_PLACES;
            this.closestPlanetDist = ROUNDED_DIST;
            
            //----------------------------------------//


            //----------------------------------------//
            //Nearest planet reltative speed
            const REL_VEL = Player.vel.sub(CLOSEST_PLANET.data.vel);
            const REL_SPEED = REL_VEL.len();
            const ROUNDED_REL_SPEED = Math.round(REL_SPEED * DISTANCE_SCALE * Time.TARGET_FPS * TEN_POW_DECIMAL_PLACES) / TEN_POW_DECIMAL_PLACES; //Rounded to <DECIMAL_PLACES> decimal places
            this.closestPlanetRelVel = ROUNDED_REL_SPEED;
            
            //----------------------------------------//
        }

        //----------------------------------------//
        //Nearest planet distance
        textRight += "Distance to '" + CLOSEST_PLANET.data.name + "': " + this.closestPlanetDist + " " + DISTANCE_UNITS + "\n";
        //----------------------------------------//

        //----------------------------------------//
        //Nearest planet relative speed
        textRight += "Relative speed: " + this.closestPlanetRelVel + " " + DISTANCE_UNITS + "/s\n";
        //----------------------------------------//


        //----------------------------------------//
        //Draw

        const RIGHT_POS = center.add(new Vec2(
            this.radius + this.outlineWidth,
            0
        ));

        const LEFT_POS = center.add(new Vec2(
            -this.radius - this.outlineWidth,
            0
        ));
        Game.renderer.fill(this.textColour);
        //Text on the left
        Game.renderer.text(textLeft, 'right', 'middle', this.textSize, this.font, LEFT_POS, false, true);

        //Text on the right
        Game.renderer.text(textRight, 'left', 'middle', this.textSize, this.font, RIGHT_POS, false, true);
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//
}
//----------------------------------------------------------------------//
