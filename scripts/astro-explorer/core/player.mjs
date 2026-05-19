//----------------------------------------------------------------------//
//                        ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Player class                                                          //
//Manages player movement and logic, as well as player rendering        //
//----------------------------------------------------------------------//
import { Planet, PlanetAtmosphere, PlanetData, PlanetOceans, PlanetSurface } from "./planet.mjs";
import { Game } from "./game.mjs";
import { Input } from "../interface/input.mjs";
import { Vec2, Colour } from "../../utility/miscellaneous.mjs";
import { Time } from "../../utility/time.mjs";
import { Particle, spawnExplosion } from "../interface/ui/particle.mjs";
import { lerp, clamp, normalizeAngle } from "../../utility/miscellaneous.mjs";

import { State } from "../../data/state.mjs";
import { Difficulty } from "../../data/difficulty.mjs";

import { HighScoreManager } from "../../data/high_score_manager.mjs";

//----------------------------------------------------------------------//
//Player class - handles player movement, rendering and logic
export class Player {
    static pos = new Vec2(0, 0);
    static vel = new Vec2(0, 0);
    static dir = 0;
    static smoothDir = 0; //Smoothly rotating dir
    static ang_vel = 0;

    static smoothZoom = 0.00001; //Smooth zoom is initialized to be more zoomed out than zoom so that the camera 'zooms in' at the start of the game
    static zoom = 8;

    static fuel = 100;
    
    static HEIGHT = 5;
    static WIDTH = 3;
    static deathCounter = 0; //A counter that starts counting up when the player dies. When it reaches deathCounterThreshold, the user is redirected to 'end.html'
    static exploded = false;
    static mightExplodeOnReentry = false; //If drawTrajectory realises that the player will explode on reentry, slow down time
    static DEATH_COUNTER_THRESH = 180; //<DEATH_COUNTER_THRESH> 'frames' at 60 'fps'

    
    
    //Reentry
    static REENTRY_PARTICLE_THRESH = 0.0008; //The drag force needed for the player to spawn reentry particles
    
    static IMMUNITY_TIME = 1; //<IMMUNITY_TIME> seconds of immunity

    static smoothScore = 0;
    static score = 0;

    //Trajectory click-to-timewarp data
    static trajectorySegments = []; //Array of {pos: Vec2, time: number} for clickable trajectory points
    static targetWarpTime = 0; //Target time to warp to on click
    static KEY_TIMEWARP = 8; //Maximum timewarp reached with keyboard input (e.g pressing space)
    static MAX_TIMEWARP_MULTIPLIER = 50; //Maximum timewarp multiplier for click-to-timewarp
    static TRAJECTORY_DT = 3; //How much time between each trajectory point (in scaledDeltaTime-s)
    static timewarpedTime = 0; //A time measure that includes timewarps
    static warpDuration = 0; //Duration of current warp in seconds (used for smoothing the timewarp transition)
    
    
    //----------------------------------------------------------------------//
    //Initialize()
    //Initialize player state
    static Initialize() {
        Player.deathCounter = 0;
        Player.exploded = false;
        Player.fuel = 100;
        Player.score = 0; //Don't reset smoothScore - the score resetting back to 0 looks cool
        Player.zoom = 8;
        Player.ang_vel = 0;
        Player.dir = 0;
        Player.smoothDir = 0;
        Player.smoothZoom = 0.00001;
        Player.trajectorySegments = [];
        Player.targetWarpTime = 0;
        Player.currentWarpDuration = 0;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    static Update(dt) {
        Player.manageInterpolatedValues(dt);

        //----------------------------------------//
        //restart the game if the player presses 'r'
        if (Input.KeyDown("KeyR")) {
            Game.Restart();
        }
        //----------------------------------------//

        //Cancel all further functions if player is dying / dead
        if (Player.deathCounter > 0) {
            //Don't use dt for death counter, instead use the raw time.scaleDeltaTime
            //dt scales with timewarp - but dying faster when timewarping reduces the player's awareness of dying
            if (Player.fuel > 0 && !Player.exploded) {
                Player.deathCounter = 0;
            } else {
                Player.deathCounter += Time.scaleDeltaTime / Game.smoothTimeWarp;
            }
            if (Player.deathCounter > Player.DEATH_COUNTER_THRESH) {
                Game.setPage(Game.END_TITLE); //Go to 'end.html'
                
            }
            
            
            Player.applyGravity(dt);
            Player.pos = Player.pos.add(Player.vel.mul(dt));
            return;
        }

        //----------------------------------------//
        
        //Manage active timewarp
        Player.timewarpedTime += dt;
        if (Player.targetWarpTime > Player.timewarpedTime) {
            console.log(Player.targetWarpTime - Player.timewarpedTime);
            const MIN_TIMEWARP = 15;
            //When warp starts, game.timewarp will be Player.MAX_TIMEWARP_MULTIPLIER
            //When warp ends, game.timewarp will be 1 + MIN_TIMEWARP
            const TIMEWARP_PROGRESS = 1 - (Player.targetWarpTime - Player.timewarpedTime) / Player.warpDuration;
            const TIMEWARP = lerp(Player.MAX_TIMEWARP_MULTIPLIER, 1, TIMEWARP_PROGRESS ** 0.5) + 5
            Game.timewarp = TIMEWARP;
            Game.smoothTimeWarp = TIMEWARP;
        } else if (Player.mightExplodeOnReentry) {
            //speed up time to cross large distances
            Game.timewarp = 0.3; //Slow down time to let the player see themself explode!
        }
        if (Input.KeyDown("Space")) {
            Game.timewarp = Player.KEY_TIMEWARP;
        } else {
            Game.timewarp = 1;
        }
        
        //----------------------------------------//

        

        Player.Integrate(dt);
        Player.updateThruster(dt);
        Player.applyGravity(dt);
        Player.applyAtmosphericEffects(dt);
    }
    //----------------------------------------------------------------------//

    

    //----------------------------------------//
    //manageInterpolatedValues()
    //interpolates things like smooth zoom, smooth score, etc
    static manageInterpolatedValues(dt) {
        //----------------------------------------//
        //Smoothly rotate so that the nearest planet tends toward the bottom of the screen
        var closestPlanet = Game.getClosestPlanet(Player.pos, true);
        var otherPos = Game.PLANETS[closestPlanet].data.pos;
        var delta = otherPos.sub(Player.pos);
        const DELTA_NORM = delta.norm(); //Normalized vector from player to planet

        //How fast to reach the target value (higher = faster, lower = smoother)
        const DIRECTION_SMOOTHING = 0.01; 
        const SMOOTH_DIR_VEC = new Vec2(Math.sin(Player.smoothDir - Math.PI), Math.cos(Player.smoothDir - Math.PI));
        
        Player.smoothDir = Vec2.slerp(SMOOTH_DIR_VEC, DELTA_NORM, DIRECTION_SMOOTHING * dt).dir() + Math.PI; 
        //----------------------------------------//
        

        //----------------------------------------//
        //Smoothly increase the displayed score to match the real score

        //How fast to reach the target value (higher = faster, lower = smoother)
        const SCORE_SMOOTHING = 0.1;
        Player.smoothScore = lerp(Player.smoothScore, Player.score, SCORE_SMOOTHING * dt);
        //----------------------------------------//


        //----------------------------------------//
        //Smoothly interpolate the player zoom to match the input value

        //How fast to reach the target value (higher = faster, lower = smoother)
        const ZOOM_SMOOTHING = 0.1;

        //-------------//
        //Im not entirely sure how this works, but it's kind of like a damper. 
        //If you change it, have a look at how it affects LONG RANGE zooming - though values above 1 seem to dampen only one direction
        const ZOOOM_POWER = 0.00005; 
        //-------------//

        Player.smoothZoom = Math.pow(lerp(Math.pow(Player.smoothZoom, ZOOOM_POWER), Math.pow(Player.zoom, ZOOOM_POWER), ZOOM_SMOOTHING * dt), 1/ZOOOM_POWER);
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//
    

    //----------------------------------------------------------------------//
    //updateThruster()
    //Manages thruster and fuel
    //Spawns thruster particles
    static updateThruster(dt) {
        if (Player.fuel != 0) {
            var inputForward = (Input.KeyDown("KeyW")) * Difficulty.Player.THRUSTER_FORCE * dt;



            if (inputForward > 0) {
                // velocity based on input and delta time
                Player.vel.x += Math.sin(Player.dir) * inputForward;
                Player.vel.y += Math.cos(Player.dir) * inputForward;

                //Reduce fuel based on fuel consumption and delta time
                Player.fuel -= Difficulty.Player.FUEL_USED_PER_FRAME * dt;

                Player.spawnThrusterParticles();
            }
            //----------------------------------------//
            
        }
        //----------------------------------------//
        //Since the above if statement might have reduced the player's fuel below 0, we need to check again
        if (Player.fuel <= 0) {
            Player.fuel = 0;
            State.setState(Game.DEATH_STATE_ID, "ran out of fuel");
            Player.die();
        }
        //----------------------------------------//
        
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //spawnRCSparticles(dir)
    //dir: boolean value, true => right, false => left
    //RCS stands for reaction control system - it is the 'propulsion' system used to rotate many rockets in space
    //I'm using it here because it looks cool
    static spawnRCSparticles(dir, strength) {
        const FRONT_DIR = new Vec2(Math.sin(Player.dir), Math.cos(Player.dir));
        const RIGHT_DIR = new Vec2(Math.sin(Player.dir + Math.PI / 2), Math.cos(Player.dir + Math.PI / 2));

        //What fraction of height up the player's length is the port (thruster)?
        const PORT_HEIGHT_FRAC = 0.9;

        //Position of the thruster port (relative to player)
        const PORT_POS = Player.pos.add(
            FRONT_DIR.mul(Player.HEIGHT / 2 * PORT_HEIGHT_FRAC).add(
                //Left or right
                (dir) ? 
                //Left (rotating right)
                    RIGHT_DIR.mul(-1 * (1 - PORT_HEIGHT_FRAC) * Player.WIDTH / 2)
                :
                //Right (rotating left)
                    RIGHT_DIR.mul((1 - PORT_HEIGHT_FRAC) * Player.WIDTH / 2)

            )
        );

        const NUM_PARTICLES = 20 * Time.scaleDeltaTime; //How many particles to spawn
        for (var i = 0; i < NUM_PARTICLES; i++) {
            const PARTICLE_VEL_DIR = Player.dir + ((dir) ? -Math.PI / 2 : Math.PI / 2);
            const VEL_RANDOMNESS = (Math.random() * 2 - 1) * 0.2 / strength;
            const PARTICLE_SPEED = 1 * strength + VEL_RANDOMNESS;
            const DIR_RANDOMNESS = ((Math.random() * 2 - 1) * 0.2) / strength;
            const PARTICLE_VEL = new Vec2(Math.sin(PARTICLE_VEL_DIR + DIR_RANDOMNESS) * PARTICLE_SPEED, Math.cos(PARTICLE_VEL_DIR + DIR_RANDOMNESS) * PARTICLE_SPEED);
            
            Game.addParticle(
                new Particle(
                    PORT_POS,
                    Player.dir,
                    PARTICLE_VEL.add(Player.vel),
                    0,
                    0.35,
                    Colour.rgba(200, 200, 200, 1 * strength),
                    Colour.rgba(200, 200, 200, 0.1 * strength),
                    Colour.rgba(200, 200, 200, 0),
                    3, 
                    function(){
                        this.width *= 1 - 0.2 * Time.scaleDeltaTime;
                    },
                    function(){}
                )
            );
        }
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //spawnThrusterParticles()
    //spawn particles emanating from the thruster of the player
    static spawnThrusterParticles() {
        //----------------------------------------//
        //Thruster particle settings
        const DIR_RANDOMNESS = 0.1;
        const VEL_RANDOMNESS = 0.1;
        const SIZE_RANDOMNESS = 0.5;

        const BASE_DIR = Player.dir + Math.PI;
        const BASE_WIDTH = 0.5;
        const BASE_SPEED = 0.7;
        const FRAME_INTERVAL = 1; //Spawn particles every <FRAME_INTERVAL> frames
        //----------------------------------------//
        //We can change how often the particles spawn
        if (Time.frame % FRAME_INTERVAL == 0) {
            
            
            
            const NUM_PARTICLES = 6; //Spawn <NUM_PARTICLES> every <FRAME_INTERVAL> frames
            for (var i = 0; i < NUM_PARTICLES; i++) {
                //----------------------------------------//
                //Flame particle settings
                //Randomly vary the particle settings
                const PARTICLE_WIDTH = BASE_WIDTH + (Math.random() * 2 - 1) * SIZE_RANDOMNESS;
                const PARTICLE_POS = new Vec2(Math.sin(Player.dir + Math.PI) * (Player.HEIGHT / 2 + PARTICLE_WIDTH / 2), Math.cos(Player.dir + Math.PI) * (Player.HEIGHT / 2 + PARTICLE_WIDTH / 2));

                const PARTICLE_DIR = BASE_DIR + (Math.random() * 2 - 1) * DIR_RANDOMNESS; //Opposite to player direction
                const SPEED = BASE_SPEED + (Math.random() * 2 - 1) * VEL_RANDOMNESS;

                var particleVel = Player.vel.add(
                    new Vec2(
                        Math.sin(PARTICLE_DIR) * SPEED, 
                        Math.cos(PARTICLE_DIR) * SPEED
                    )
                );
                //----------------------------------------//
                Game.addParticle(new Particle(Player.pos.add(PARTICLE_POS), Player.dir, 
                particleVel, 0, 
                PARTICLE_WIDTH, 
                Colour.rgba(255, 178, 115, 1), 
                Colour.rgba(255, 102, 0, 0.2), 
                Colour.rgba(0, 0, 0, 0), 
                15,

                    //----------------------------------------//
                    //Update()
                    function(dt){ //Update
                        //Increase the width of the particle, but slowly decrease it as it ages
                        const CONSTANT_INCREASE = 0.2;
                        const GRADUAL_DECREASE = 0.6;
                        this.width += CONSTANT_INCREASE * dt - this.frame / this.lifetime * GRADUAL_DECREASE * dt;
                        
                        var p = Game.getClosestPlanet(this.pos, true);
                        const OTHER = Game.PLANETS[p];
                        const DELTA = this.pos.sub(OTHER.data.pos);
                        const DIST = DELTA.len() - this.width / 2;
                        const DELTA_NORM = DELTA.norm();

                        //If the particle is colliding with the planet, change the particle's velocity and shift it to above the surface to resolve the collision.
                        //CAN ONLY HAPPEN IF PLANET ACTUALLY HAS A SURFACE!!!
                        if (DIST < OTHER.data.radius && OTHER.land != null) {
                            
                            //Change the particle's direction to imitate a 'spread outward' effect
                            const DOT = Vec2.dot(this.vel.sub(OTHER.data.vel), DELTA_NORM);

                            const ROTATABLE_VEL = DELTA_NORM.mul(DOT); //Velocity RELATIVE TO PLANET along DELTA_NORM
                            const DIF = this.vel.sub(ROTATABLE_VEL);//Difference between particle vel and relative particle vel along DELTA_NORM
                            const ROTATED_VEL = ROTATABLE_VEL.rotate((Math.random() > 0.5) ? 0 : Math.PI); 
                            this.vel = DIF.add(ROTATED_VEL.mul(2)); //Make the particle spread outward while still moving with the planet's orbital velocity

                            var colour = Colour.rgb(164, 164, 164);
                            var landColour = Colour.rgb(0,0,0);
                            //Use mantle colour for consistensy (e.g avoid earth's grass 'land.colour', or mars's dark 'land.innerColour')
                            landColour = Colour.rgba(OTHER.land.mantleColour.r, OTHER.land.mantleColour.g, OTHER.land.mantleColour.b, 0);
                            this.startColour = Colour.lerp(colour, landColour, 0);
                            this.startColour.a = 0.8;
                            this.midColour = Colour.lerp(colour, landColour, 0.3);
                            this.midColour.a = 0.3;
                            this.endColour = Colour.lerp(colour, landColour, 0.7);
                            this.endColour.a = 0;
                            
                            this.dir = DELTA.dir(); //Lock the player outward
                            this.angVel = (Math.random() * 2 - 1) * 0.1;
                            this.frame = 0;
                            this.lifetime *= 2;
                            this.update = function(dt){

                                //Get the closest planet
                                var closestPlanet = Game.getClosestPlanet(this.pos, true);
                                var other = Game.PLANETS[closestPlanet];
                                var relVel = this.vel.sub(other.data.vel);//Relative velocity
                                var delta = this.pos.sub(other.data.pos);//Difference in position between player and plaent
                                
                                const DELTA_NORM = delta.norm();//Normalized delta

                                //The increase in width of the particle this frame
                                const WIDTH_INCREASE = 0.2 * dt * relVel.len() * (Math.pow(this.frame / this.lifetime, 2) * 5); 
                                this.width += WIDTH_INCREASE; //Increase width

                                //Prevent the particle clipping into the planet by shifting it up by half the width increase this frame
                                this.pos = this.pos.add(DELTA_NORM.mul(WIDTH_INCREASE / 2));
                            };
                            
                        }
                    
                    }, 
                    //----------------------------------------//

                    

                    //----------------------------------------//
                    //OnDeath()
                    function(){}
                    //----------------------------------------//
                ));
            }
            //End of particle constructor
            //----------------------------------------//
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //applyGravity()
    //Applies gravitational attraction from planets to the player
    static applyGravity(dt) {
        //Loop through all the planets, calculate the attraction and apply it
        for (var p = 0; p < Game.PLANETS.length; p++) {
            const OTHER = Game.PLANETS[p];
            
            var delta = OTHER.data.pos.sub(Player.pos);
            var dist = delta.len() - Player.HEIGHT / 2;
            const DELTA_NORM = delta.norm();
            const GRAVITY = Game.G * OTHER.data.mass / (dist * dist) * dt;
            
            Player.collideWithPlanet(p, OTHER, DELTA_NORM, GRAVITY, dt);
            
            
            //Update the player's velocity
            //Gravity is defined above the if statement so as to be visible to both this line
            //and the tipping / stabilizing logic above.
            Player.vel = Player.vel.add(DELTA_NORM.mul(GRAVITY));
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //collideWithPlanet(OTHER, DELTA_NORM)
    //OTHER: the planet you collided with
    //DELTA_NORM: the normalized delta position between planet and player
    static collideWithPlanet(idx, OTHER, DELTA_NORM, GRAVITY, dt) {
        if (OTHER.land == null) return; //Planet has no surface to collide with
        
        //If you are colliding with the planet, match its velocity and shift to above the surface to resolve the collision.
        if (Player.isIntersecting(Player.pos, OTHER.data.pos, OTHER.data.radius)) {
            //----------------------------------------//
            //resolve collision
            while (Player.isIntersecting(Player.pos, OTHER.data.pos, OTHER.data.radius)) {
                
                Player.pos = Player.pos.sub(DELTA_NORM.mul(new Vec2(0.01, 0.01)));
            }
            var delta = OTHER.data.pos.sub(Player.pos);
            var dist = delta.len();
            //----------------------------------------//

            
            //----------------------------------------//
            const REL_VEL = Player.vel.sub(OTHER.data.vel);

            //Adjust velocity (skid / slide)
            const FRICTION = 0.9; //Closer to one = slicker
            const SKID_VEL = REL_VEL.mul(FRICTION);
            Player.vel = OTHER.data.vel.add(SKID_VEL);

            

            //only explode if the player hasn't already exploded
            //don't explode if not moving
            const MIN_VEL = 0.05;
            if (Player.isImpactFatal(REL_VEL, DELTA_NORM) && !Player.exploded && REL_VEL.len() > MIN_VEL) {
                State.setState(Game.DEATH_STATE_ID, "crashed");
                Player.explode();
                return;
            }
            //----------------------------------------//

            //Only discover a planet if you can do so
            if (!Player.exploded) Player.discoverPlanet(idx);

            
            
            const DIR_DIFF = normalizeAngle(Player.dir) - normalizeAngle(delta.dir());
            
            
            const MIN_VEL_FOR_SHEAR_TILT = 0.075;
            if (REL_VEL.len() > MIN_VEL_FOR_SHEAR_TILT) {
                //Player is sliding sideways, tip over

                //Parallel to planet surface
                const SIDE_AXIS = Vec2.rotatePoint(DELTA_NORM, Math.PI / 2);

                const VEL_DOT_AXIS = Vec2.dot(REL_VEL, SIDE_AXIS);

                //The proportion of REL_VEL along SIDE_AXIS
                const PROJECTION_ALONG_SIDE_AXIS = SIDE_AXIS.mul(VEL_DOT_AXIS);


                const SHEAR_TORQUE = PROJECTION_ALONG_SIDE_AXIS.len() * Math.sign(VEL_DOT_AXIS) * 1;
                Player.ang_vel = SHEAR_TORQUE * dt;
            }

            const TIP_THRESH = 0.55;
            
            if (Math.abs(DIR_DIFF) > TIP_THRESH) {
                //Player is unbalanced, tip over
                //The force will increase due to leverage
                //Power of 3 is just an arbritrary value that looks good
                Player.ang_vel += ((DIR_DIFF * 2) ** 3) * GRAVITY * dt * 4;
            } else {
                //Stabilize the player
                const LOSS = 0.005; //e.g damping, losses in collision / bounce
                Player.ang_vel *= 1 - LOSS ** (1 / dt);
                Player.ang_vel -= ((DIR_DIFF) * GRAVITY) * dt * 4;
            }
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //isImpactFatal(relative velocity, deltaNorm)
    //returns true or false depending on how severe the impact was
    //true = die
    //false = live
    static isImpactFatal(relVel, deltaNorm) {
        const DIR_DOT_DELTA_NORM = Vec2.dot(new Vec2(Math.sin(Player.dir), Math.cos(Player.dir)), deltaNorm);
        const IMPACT_SEVERITY = 
        //Punish the player for not landing upright
        Math.max(DIR_DOT_DELTA_NORM, 0) * Difficulty.Player.IMPACT_FATALITY_DIRECTION_COMPONENT; 
        
        return (relVel.len() > (Difficulty.Player.IMPACT_TOLERANCE - IMPACT_SEVERITY));
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //isIntersecting(pos, point, radius)
    //pos: player pos
    //point: is this point intersecting the player
    //radius: the distance to point 'point' required for an intersection - could be planet radius or just padding
    static isIntersecting(pos, point, radius) {
        const HEIGHT_OFFSET = new Vec2(Math.sin(Player.dir) * Player.HEIGHT, Math.cos(Player.dir) * Player.HEIGHT);
        const WIDTH_OFFSET = new Vec2(Math.sin(Player.dir + Math.PI / 2) * Player.WIDTH, Math.cos(Player.dir + Math.PI / 2) * Player.WIDTH);

        //The local space positions of the player's vertices
        const DELTA_FRONT = HEIGHT_OFFSET.mul(new Vec2(0.5, 0.5));
        const DELTA_RIGHT = HEIGHT_OFFSET.mul(new Vec2(-0.5, -0.5)).add(WIDTH_OFFSET.mul(new Vec2(0.5, 0.5)));
        const DELTA_LEFT = HEIGHT_OFFSET.mul(new Vec2(-0.5, -0.5)).add(WIDTH_OFFSET.mul(new Vec2(-0.5, -0.5)));

        //The world space positions of the player's vertices
        const FRONT = DELTA_FRONT.add(pos);
        const RIGHT = DELTA_RIGHT.add(pos);
        const LEFT = DELTA_LEFT.add(pos);

        const FRONT_DIST = Vec2.dist(FRONT, point);
        const FRONT_INTERSECTING = FRONT_DIST < radius;
        if (FRONT_INTERSECTING) return true;

        const RIGHT_DIST = Vec2.dist(RIGHT, point);
        const RIGHT_INTERSECTING = RIGHT_DIST < radius;
        if (RIGHT_INTERSECTING) return true;

        const LEFT_DIST = Vec2.dist(LEFT, point);
        const LEFT_INTERSECTING = LEFT_DIST < radius;
        if (LEFT_INTERSECTING) return true;

        return false; //No intersection
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //getHeat()
    //basically just proportional to drag
    static getHeat(pos, vel, planets = Game.PLANETS) {
        //From 0 - Player.REENTRY_TOLERANCE
        const DRAG = Player.getReentrySeverity(pos, vel, planets);
        const SCALE_DRAG = DRAG / Difficulty.Player.REENTRY_TOLERANCE;

        return SCALE_DRAG;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //calculateDragForce()
    //(parameters abtracted away so that drawTrajectory can use it without creating planet objects)
    //Calculates atmospheric drag force for a given position, velocity, and planet
    //
    //playerPos: Vec2 of player position
    //playerVel: Vec2 of player velocity
    //planetAtmosphere: atmosphere object from planet data (null if no atmosphere)
    //planetPos: Vec2 of planet position
    //planetVel: Vec2 of planet velocity
    //playerDir: player rotation angle (used for directional drag calculation)
    //
    //Returns: Vec2 drag force vector
    static calculateDragForce(playerPos, playerVel, planetAtmosphere, planetPos, planetVel, playerDir) {
        //If planet has no atmosphere, no drag is applied
        if (planetAtmosphere == null) {
            return new Vec2(0, 0);
        }

        const DELTA = planetPos.sub(playerPos);
        const DIST = DELTA.len();
        const ATMO_RAD = planetAtmosphere.radius;

        //Check if player is within atmosphere bounds
        if (DIST > ATMO_RAD) {
            return new Vec2(0, 0);
        }

        //Calculate relative velocity between player and planet
        const REL_VEL = playerVel.sub(planetVel);
        const REL_VEL_NORM = REL_VEL.norm();
        const SQR_VEL_MAG = REL_VEL.sqrMag();

        //Avoid division by zero if relative velocity is negligible
        if (SQR_VEL_MAG < 0.00000001) {
            return new Vec2(0, 0);
        }

        //----------------------------------------//
        //Calculate air density as a function of altitude
        //Density varies from 1 at sea level to 0 at atmosphere edge
        //Using exponential profile with power factor for realistic falloff
        //----------------------------------------//
        const SEA_LEVEL_RAD = planetAtmosphere.seaLvlRadius;
        const SEA_LEVEL_DENSITY = planetAtmosphere.seaLvlDensity;
        const DENSITY_POWER = 5;

        //Linear interpolation factor for density calculation
        const X1 = SEA_LEVEL_RAD;
        const X2 = ATMO_RAD;
        const Y1 = 1; //Full density at sea level
        const Y2 = 0; //No density at atmosphere edge
        const M = (Y2 - Y1) / (X2 - X1);

        //Calculate normalized air density (0 to 1) then scale to actual density
        const AIR_DENSITY_NORM = Math.pow(M * (DIST - X1) + Y1, DENSITY_POWER);
        const AIR_DENSITY = SEA_LEVEL_DENSITY * AIR_DENSITY_NORM;

        //----------------------------------------//
        //Calculate directional drag component
        //Drag depends on the angle between velocity vector and player orientation
        //Reduces drag when facing in the direction of motion
        //----------------------------------------//
        const DIR_VEC_NORM = new Vec2(Math.sin(playerDir), Math.cos(playerDir));
        const RV_N_DOT_DV_N = Vec2.dot(REL_VEL_NORM, DIR_VEC_NORM);

        //The effect of the player direction on the drag
        //(1 - (RV_N_DOT_DV_N + 1) / 2) maps dot product [-1,1] to [0,1]
        //-1 facing away = high drag, 1 facing toward = low drag
        const MOST_DRAG = 0.2;
        const DIRECTIONAL_DRAG = MOST_DRAG * (1 - (RV_N_DOT_DV_N + 1) / 2);

        const BASE_DRAG = 0.05;
        const DRAG_COEFFICIENT = BASE_DRAG + DIRECTIONAL_DRAG;

        //Calculate final drag force
        const DRAG_FORCE = REL_VEL_NORM.mul(-1 * 0.5 * DRAG_COEFFICIENT * SQR_VEL_MAG * AIR_DENSITY);

        return DRAG_FORCE;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //calculateDragForceComponents()
    //Primitive-based version of calculateDragForce for high-performance scenarios
    //Returns drag force as {x, y} components instead of Vec2 object
    //
    //Parameters:
    //playerPosX, playerPosY: player position components
    //playerVelX, playerVelY: player velocity components
    //planetAtmosphere: atmosphere object from planet data
    //planetPosX, planetPosY: planet position components
    //planetVelX, planetVelY: planet velocity components
    //playerDirX, playerDirY: player direction as unit vector components
    //
    //Returns: {x, y} drag force components
    static calculateDragForceComponents(playerPosX, playerPosY, playerVelX, playerVelY, 
                                       planetAtmosphere, planetPosX, planetPosY, planetVelX, planetVelY,
                                       playerDirX, playerDirY) {
        //If planet has no atmosphere, no drag is applied
        if (planetAtmosphere == null) {
            return { x: 0, y: 0 };
        }

        const DX = planetPosX - playerPosX;
        const DY = planetPosY - playerPosY;
        const DIST_SQ = DX * DX + DY * DY;
        const DIST = Math.sqrt(DIST_SQ);
        const ATMO_RAD = planetAtmosphere.radius;

        //Check if player is within atmosphere bounds
        if (DIST > ATMO_RAD) {
            return { x: 0, y: 0 };
        }

        //Calculate relative velocity between player and planet
        const REL_VEL_X = playerVelX - planetVelX;
        const REL_VEL_Y = playerVelY - planetVelY;
        const REL_VEL_MAG_SQ = REL_VEL_X * REL_VEL_X + REL_VEL_Y * REL_VEL_Y;

        //Avoid division by zero if relative velocity is negligible
        if (REL_VEL_MAG_SQ < 0.00000001) {
            return { x: 0, y: 0 };
        }

        const REL_VEL_MAG = Math.sqrt(REL_VEL_MAG_SQ);
        const REL_VEL_NORM_X = REL_VEL_X / REL_VEL_MAG;
        const REL_VEL_NORM_Y = REL_VEL_Y / REL_VEL_MAG;

        //----------------------------------------//
        //Calculate air density as a function of altitude
        //Density varies from 1 at sea level to 0 at atmosphere edge
        //Using exponential profile with power factor for realistic falloff
        //----------------------------------------//
        const SEA_LEVEL_RAD = planetAtmosphere.seaLvlRadius;
        const SEA_LEVEL_DENSITY = planetAtmosphere.seaLvlDensity;
        const DENSITY_POWER = 5;

        const X1 = SEA_LEVEL_RAD;
        const X2 = ATMO_RAD;
        const Y1 = 1; //Full density at sea level
        const Y2 = 0; //No density at atmosphere edge
        const M = (Y2 - Y1) / (X2 - X1);

        //Calculate normalized air density (0 to 1) then scale to actual density
        const AIR_DENSITY_NORM = Math.pow(M * (DIST - X1) + Y1, DENSITY_POWER);
        const AIR_DENSITY = SEA_LEVEL_DENSITY * AIR_DENSITY_NORM;

        //----------------------------------------//
        //Calculate directional drag component
        //Drag depends on the angle between velocity vector and player orientation
        //----------------------------------------//
        const RV_N_DOT_DV_N = REL_VEL_NORM_X * playerDirX + REL_VEL_NORM_Y * playerDirY;

        const MOST_DRAG = 0.2;
        const DIRECTIONAL_DRAG = MOST_DRAG * (1 - (RV_N_DOT_DV_N + 1) / 2);

        const BASE_DRAG = 0.05;
        const DRAG_COEFFICIENT = BASE_DRAG + DIRECTIONAL_DRAG;

        //Calculate final drag force components
        const DRAG_SCALE = -1 * 0.5 * DRAG_COEFFICIENT * REL_VEL_MAG_SQ * AIR_DENSITY;
        
        return {
            x: DRAG_SCALE * REL_VEL_NORM_X,
            y: DRAG_SCALE * REL_VEL_NORM_Y
        };
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //getDrag()
    //returns the drag force experienced by the player at velocity 'vel' and
    //position 'pos'
    static getDrag(pos, vel, planets = Game.PLANETS) {
        //----------------------------------------//
        //is the player in an atmosphere?
        const OTHER = planets[Game.getClosestPlanet(pos, true, planets)];
        const DRAG_FORCE = Player.calculateDragForce(pos, vel, OTHER.atmosphere, OTHER.data.pos, OTHER.data.vel, Player.dir);
        
        return DRAG_FORCE;
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //GetReentrySeverity()
    //pos: the position of the assessment of severity
    //vel: the velocity of the assessment of severity
    //returns: a number based on how severe the reentry is at pos and vel
    static getReentrySeverity(pos, vel, planets = Game.PLANETS) {
        const DRAG = Player.getDrag(pos, vel, planets);
        const DRAG_MAGNITUDE = DRAG.len();
        return DRAG_MAGNITUDE;
    }
    //----------------------------------------------------------------------//

    
    //----------------------------------------------------------------------//
    //applyAtmosphericEffects()
    //Returns velocity 'vel' with aerodynamic forces applied
    static applyAtmosphericEffects(dt) {
        //Drag
        const DRAG = Player.getDrag(Player.pos, Player.vel);
        Player.vel = Player.vel.add(DRAG.mul(dt)); //Drag is already negative, so we add it to velocity

        //Reentry
        const REENTRY_SEVERITY = Player.getReentrySeverity(Player.pos, Player.vel);
        Player.spawnReentryParticles(REENTRY_SEVERITY);
        if (Player.getHeat(Player.pos, Player.vel) >= 1) {
            State.setState(Game.DEATH_STATE_ID, "burnt up during reentry");
            Player.explode();
            return;
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //spawnReentryParticles()
    //severity: the severity of the current reentry state
    //relVel: the relative velocity of the player to the closest planet
    static spawnReentryParticles(severity) {
        const INTERVAL = 1; //0 for not at all, 1 for all the time

        if (severity > Player.REENTRY_PARTICLE_THRESH && Time.seconds % 1 < INTERVAL) {
            //----------------------------------------//
            //Reentry is severe enough to spawn particles
            //----------------------------------------//


            //from 0 - 1, will 'usually' only reach ~0.3 - ~0.7 during 'normal' gameplay
            const SEVERITY_NORM = severity / Difficulty.Player.REENTRY_TOLERANCE;
            
            //0 when high severity, 1 when low severity
            const SEVERITY_BLEND = clamp(1 - 4 * SEVERITY_NORM, 0, 1); 
            const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
            const OTHER_VEL = Game.PLANETS[CLOSEST_IDX].data.vel;

            //----------------------------------------//
            //The width gets larger the more severe the reentry is
            const STARTING_WIDTH = clamp(10 * SEVERITY_NORM, 0, 4);
            const VEL_RANDOMNESS = 0.15 * (1 - SEVERITY_BLEND); //Velocity gets more random when the player is on a severe reentry (severity_blend == )
            const VEL = OTHER_VEL.add(
                new Vec2(
                    //(Math.random() * 2 - 1) is in range [-1] -> [+1]
                    (Math.random() * 2 - 1) * VEL_RANDOMNESS, 
                    (Math.random() * 2 - 1) * VEL_RANDOMNESS
                )
            );
            //----------------------------------------//


            //----------------------------------------//
            //Colours

            //Colour of the nearest planet's atmosphere
            const OTHER_COLOUR = Colour.clone(Game.PLANETS[CLOSEST_IDX].atmosphere.atmoColourLow);

            //Make it more transparent when the reentry isn't too severe
            OTHER_COLOUR.a *= SEVERITY_NORM;

            //Dark colour to lerp toward
            const BLACK = Colour.rgba(0, 0, 0, 0);

            //Make the particle get darker the further through its lifetime it is
            const OTHER_COLOUR_DARKENED = Colour.lerp(OTHER_COLOUR, BLACK, 0.66);
            
            //Make it more transparent when the reentry isn't too severe
            OTHER_COLOUR_DARKENED.a *= SEVERITY_NORM;
            //----------------------------------------//
            
            //----------------------------------------//
            //Spawn the particle
            Game.addParticle(
                new Particle(
                    Player.pos, Player.dir, 
                    VEL, 0, 
                    STARTING_WIDTH, 

                    //Colours
                    Colour.lerp(Colour.rgba(250, 150, 50, 0.8), OTHER_COLOUR, SEVERITY_BLEND), //Start
                    Colour.lerp(Colour.rgba(150,120,0, 0.5), OTHER_COLOUR_DARKENED, SEVERITY_BLEND), //Mid
                    Colour.lerp(Colour.rgba(100, 20, 0, 0), BLACK, SEVERITY_BLEND), //End

                    40, //Lifetime

                    //----------------------------------------//
                    //Update
                    function(){
                        //Make the particle dwindle in size over time
                        this.width *= 0.95 / Time.scaleDeltaTime;

                        //Don't let width go below 0 or exceed the starting width
                        this.width = clamp(this.width, 0, STARTING_WIDTH);;
                    }, 
                    //----------------------------------------//
                    
                    function(){} //No onDeath function
                )
            );
            //----------------------------------------//
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Integrate()
    //Integrates the players position and rotation
    static Integrate(dt) {
        //----------------------------------------//
        //Integrate zoom based on input and delta time
        const ZOOM_SPEED = 0.05 / Game.smoothTimeWarp;
        Player.zoom *= ((Input.KeyDown("ArrowUp") * ZOOM_SPEED * dt + 1) / (Input.KeyDown("ArrowDown") * ZOOM_SPEED * dt + 1));
        Player.zoom = clamp(Player.zoom, 0.006, 50); //Restrict player zoom
        
        //----------------------------------------//


        //----------------------------------------//
        //Rotate
        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;
        Player.ang_vel += rotate * Time.scaleDeltaTime;
        const ANGULAR_FRICTION = 0.1;
        const SLOWDOWN = Math.exp(-1 * ANGULAR_FRICTION / (Math.abs(rotate) * 100 + 1) * Time.scaleDeltaTime);
        const MIN_ANG_VEL = 0.01;
        if (rotate == 0 && Math.abs(this.ang_vel) > MIN_ANG_VEL) {
            Player.spawnRCSparticles(this.ang_vel < 0, 0.5);
        }
        Player.ang_vel *= SLOWDOWN;
        //----------------------------------------//



        //----------------------------------------//
        //Integrate position based on velocity and delta time
        Player.pos = Player.pos.add(Player.vel.mul(dt));

        //Integrate rotation based on angular velocity and delta time
        Player.dir += Player.ang_vel * Time.scaleDeltaTime / Game.smoothTimeWarp;

        //Spawn rotation thruster particles 
        if (rotate != 0) Player.spawnRCSparticles(rotate > 0, 1);
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //clickToTimeWarp()
    //If the mouse is close enough to a point on the trajectory, warp to that point
    static clickToTimeWarp() {
        //----------------------------------------//
        function DrawTimewarpMarker(pos) {
            //Outer marker
            Game.renderer.stroke(Colour.rgba(37, 112, 199, 0.5), 10, false, true);
            Game.renderer.beginPath();
            Game.renderer.arc(
                pos,
                15, 
                0, Math.PI * 2, 
                false, true
            );
            Game.renderer.strokeShape();

            //Inner marker
            Game.renderer.fill(Colour.rgba(37, 112, 199, 1));
            Game.renderer.beginPath();
            Game.renderer.arc(
                pos,
                5, 
                0, Math.PI * 2, 
                false, true
            );
            Game.renderer.fillShape();
        }
        //----------------------------------------//

        //----------------------------------------//
        const MOUSE_POS = new Vec2(Input.mouseX, Input.mouseY);
        const WARP_THRESH = 100;
        let closestIdx = -1;
        let closestDistSq = Infinity;
        let closestSegment = null;
        //----------------------------------------//

        //----------------------------------------//
        // find closest trajectory point
        for (let t = 0; t < Player.trajectorySegments.length; t++) {
            const SEGMENTS = Player.trajectorySegments[t];
            for (let i = 0; i < SEGMENTS.length; i++) {
                const SEG = SEGMENTS[i];
                const POINT_CANVAS = Game.renderer.worldToCanvas(new Vec2(SEG.x1, SEG.y1), true, true);
                const DIST_SQR = Vec2.sqrDist(POINT_CANVAS, MOUSE_POS);
                if (DIST_SQR < closestDistSq) {
                    closestDistSq = DIST_SQR;
                    closestIdx = i;
                    closestSegment = SEG;
                }
            }
        }
        //----------------------------------------//

        //----------------------------------------//
        if (closestDistSq < WARP_THRESH * WARP_THRESH && closestIdx !== -1) {
            const TARGET_TIME = closestSegment.time;
            if (Input.mouseDown) {
                Player.targetWarpTime = Player.timewarpedTime + TARGET_TIME;
                Player.warpDuration = TARGET_TIME;
            }
            // Draw marker
            const TARGET_CANVAS_POS = new Vec2(closestSegment.x1, closestSegment.y1);
            const POS = Game.renderer.worldToCanvas(
                            new Vec2(TARGET_CANVAS_POS.x, TARGET_CANVAS_POS.y), 
                            true, false
                        ).mul(new Vec2(1, -1));

                        
            DrawTimewarpMarker(POS);
        }
        //----------------------------------------//


        //----------------------------------------//
        //Draw where the player is warping to (if applicable)
        if (Player.targetWarpTime > Player.timewarpedTime) {
            //We are warping, show where we are warping to
            for (var i = 0; i < Player.trajectorySegments.length; i++) {
                const SEGMENTS = Player.trajectorySegments[i];
                for (var j = 0; j < SEGMENTS.length; j++) {
                    const SEGMENT = SEGMENTS[j];
                    if (SEGMENT.time + Player.timewarpedTime > Player.targetWarpTime && SEGMENT.time + Player.timewarpedTime - Player.targetWarpTime < Player.TRAJECTORY_DT * 2) {
                        const TARGET_POS = new Vec2(SEGMENT.x1, SEGMENT.y1);
                        const POS = Game.renderer.worldToCanvas(
                                        new Vec2(TARGET_POS.x, TARGET_POS.y), 
                                        true, false
                                    ).mul(new Vec2(1, -1));
                        DrawTimewarpMarker(POS);
                        break;
                    }
                }
            }
        }
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //
    //                     RENDERING FUNCTIONS
    //
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        Player.drawTrajectory();
        Player.drawPlayer(new Vec2(0, 0), 1, true, true, false);
        Player.drawOutline();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //drawOutline()
    //draws an outline around the player if the camera is too zoomed out to see it
    static drawOutline() {
        const ZOOM_THRESH = 2; 
        //Don't draw the outline if the user can see the player icon
        if (Player.zoom > ZOOM_THRESH) return;

        //Fade in and out
        const ALPHA_MUL = clamp(ZOOM_THRESH / Player.zoom - 1, 0, 1);

        //----------------------------------------//
        //Outline
        const OUTLINE_COLOUR = Colour.rgba(50, 60, 150, ALPHA_MUL);
        const OUTLINE_WIDTH = 5;
        const OUTLINE_RADIUS = 30;
        Game.renderer.stroke(OUTLINE_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Player velocity
        const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
        const REL_VEL = Player.vel.sub(Game.PLANETS[CLOSEST_IDX].data.vel);
        const VEL_MARKER_COLOUR = Colour.rgba(30, 255, 0, 0.5 * ALPHA_MUL);
        const VEL_MARKER_WIDTH = 0.5;
        Game.renderer.stroke(VEL_MARKER_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, REL_VEL.dir() + Math.PI / 2 - VEL_MARKER_WIDTH / 2, REL_VEL.dir() + Math.PI / 2 + VEL_MARKER_WIDTH / 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Player drag
        const DRAG = Player.getDrag(Player.pos, Player.vel);
        const HEAT = Player.getHeat(Player.pos, Player.vel);
        const DRAG_MARKER_COLOUR = Colour.rgba(255, 166, 0, HEAT / Difficulty.Player.REENTRY_TOLERANCE * ALPHA_MUL);
        const DRAG_MARKER_WIDTH = 1;
        Game.renderer.stroke(DRAG_MARKER_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, DRAG.dir() + Math.PI / 2 - DRAG_MARKER_WIDTH / 2, DRAG.dir() + Math.PI / 2 + DRAG_MARKER_WIDTH / 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Player direction
        const DIR_MARKER_COLOUR = Colour.rgba(255, 247, 231, 1 * ALPHA_MUL);
        const DIR_MARKER_WIDTH = 0.3;
        Game.renderer.stroke(DIR_MARKER_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, Player.dir - Math.PI / 2 - DIR_MARKER_WIDTH / 2, Player.dir - Math.PI / 2 + DIR_MARKER_WIDTH / 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //drawPlayer(offset, scale, playerRelative, doScreenScale, useSmoothDirDiff)
    //Draws the player based on an offset, scale, and whether it is relative to the player position and or scales with screen size
    //useSmoothDirDiff: if true, replace Player.dir with Player.dir - Player.smoothDir
    static drawPlayer(offset, scale, playerRelative, doScreenScale, useSmoothDirDiff) {
        if (this.exploded) return; //Don't render the player if they exploded!
        if (playerRelative) offset = offset.add(Player.pos);

        const DIR = (useSmoothDirDiff) ? Player.dir - Player.smoothDir : Player.dir;
        const heightOffset = new Vec2(Math.sin(DIR) * Player.HEIGHT * scale, Math.cos(DIR) * Player.HEIGHT * scale);
        const widthOffset = new Vec2(Math.sin(DIR + Math.PI / 2) * Player.WIDTH * scale, Math.cos(DIR + Math.PI / 2) * Player.WIDTH * scale);

        //Draw the player, centered (e.g top of player is half the player height upward)
        var deltaFront = heightOffset.mul(new Vec2(0.5, 0.5));
        var deltaRight = heightOffset.mul(new Vec2(-0.5, -0.5)).add(widthOffset.mul(new Vec2(0.5, 0.5)));
        var deltaLeft = heightOffset.mul(new Vec2(-0.5, -0.5)).add(widthOffset.mul(new Vec2(-0.5, -0.5)));
        var vertices = [offset.add(deltaFront), offset.add(deltaRight), offset.add(deltaLeft)];

        Game.renderer.fill('white');
        Game.renderer.stroke('black', 0.5 * scale, playerRelative, doScreenScale);
        Game.renderer.drawPolygon(vertices, playerRelative, doScreenScale);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //drawTrajectory()
    //Simulates and draws the future trajectory of the player
    //Uses primitive-based physics simulation for maximum performance
    //
    //This function creates a projection of where the player will go by simulating
    //their motion through gravity, drag, and other forces into the future. It then
    //renders this trajectory as coloured lines and marks intercepts with planets.
    static drawTrajectory() {
        //----------------------------------------//
        //CONSTANTS & SETUP
        //----------------------------------------//
        
        //Simulation depth (how far into the future to simulate)
        //Scales with camera zoom: zoomed out = longer prediction
        const MAX_DEPTH = 5000; 
        const DEPTH = MAX_DEPTH / clamp(Player.smoothZoom * 5, 1, 10);
        const DT = Player.TRAJECTORY_DT; //Time step (1 = max precision; used for Euler integration)
        
        //Clear previous trajectory segments for click detection
        Player.trajectorySegments = [];
        const TRAJECTORY_SAMPLE_INTERVAL = 20; //Sample trajectory point every N iterations
        var trajectoryTime = 0; //Tracks simulated time in seconds
        
        //Visual indicators for trajectory intersections
        const INTERCEPT_CIRCLE_RADIUS = 50;
        const INTERCEPT_CIRCLE_THICKNESS = 6;
        const MIN_DIST_FOR_IMPACT_MARKER_SQRD = 2500; //Min distance to draw impact circle
        const THRESH_MUL_RAD = Planet.LOCATOR_RADIUS_RAD_MUL; //Detection radius multiplier
        const SECONDS_BEFORE_DEATH = 0.3; //Time to warn player before reentry death
        
        //Performance optimization: calculate drag every N iterations instead of every frame
        //Drag calculation is expensive (atmosphere lookups), so we cache & interpolate
        const DRAG_CALC_INTERVAL = 10;
        const G_DT = Game.G * DT; //Pre-multiply gravity constant with time step
        
        //----------------------------------------//
        //LOCATE SUN (used as fallback trajectory target)
        //----------------------------------------//
        var startSunIdx = 0;
        for (var p = 0; p < Game.PLANETS.length; p++) {
            if (Game.PLANETS[p].data.name == "sun") startSunIdx = p;
        }
        
        const PLANET_COUNT = Game.PLANETS.length;
        const PLAYER_POS = Player.pos; //Starting position for impact distance checks
        
        //----------------------------------------//
        //CACHE PLANET STATIC DATA
        //Using Float32Array and Uint8Array instead of Vec2 objects for 3x speed improvement
        //This avoids allocating 100,000+ objects during the 20,000-iteration simulation
        //----------------------------------------//
        
        //Initial planet positions (used for rendering in world space)
        const START_POS_X = new Float32Array(PLANET_COUNT);
        const START_POS_Y = new Float32Array(PLANET_COUNT);
        
        //Planet physical properties (cached to avoid repeated lookups)
        const PLANET_MASS = new Float32Array(PLANET_COUNT);
        const PLANET_RAD = new Float32Array(PLANET_COUNT);
        const PLANET_RAD_SQRD = new Float32Array(PLANET_COUNT); //Pre-squared for collision checks
        const THRESH_SQRD = new Float32Array(PLANET_COUNT); //Pre-squared intercept detection radius
        
        //Planet properties for rendering
        const HAS_LAND = new Uint8Array(PLANET_COUNT);
        const LAND_COLOUR = new Array(PLANET_COUNT);
        
        //Load planet data into typed arrays
        for (var i = 0; i < PLANET_COUNT; i++) {
            const P = Game.PLANETS[i];
            START_POS_X[i] = P.data.pos.x;
            START_POS_Y[i] = P.data.pos.y;
            PLANET_MASS[i] = P.data.mass;
            PLANET_RAD[i] = P.data.radius;
            PLANET_RAD_SQRD[i] = P.data.radius * P.data.radius;
            const T = P.data.radius * THRESH_MUL_RAD;
            THRESH_SQRD[i] = T * T;
            HAS_LAND[i] = P.land != null ? 1 : 0;
            LAND_COLOUR[i] = P.land ? P.land.colour : Colour.rgb(255, 27, 27);
        }
        
        //----------------------------------------//
        //INITIALIZE PLAYER STATE (primitive-based, not Vec2)
        //x, y components stored separately for fast iteration
        //----------------------------------------//
        var posX = Player.pos.x;
        var posY = Player.pos.y;
        var velX = Player.vel.x;
        var velY = Player.vel.y;
        var lastPosX = posX; //Previous position for drawing line segments
        var lastPosY = posY;
        
        //----------------------------------------//
        //INITIALIZE PLANET DYNAMICS
        //Float32Arrays store component versions of positions and velocities
        //Allows fast tight loops without object allocation overhead
        //----------------------------------------//
        const P_POS_X = new Float32Array(PLANET_COUNT);
        const P_POS_Y = new Float32Array(PLANET_COUNT);
        const P_VEL_X = new Float32Array(PLANET_COUNT);
        const P_VEL_Y = new Float32Array(PLANET_COUNT);
        const P_PREV_X = new Float32Array(PLANET_COUNT); //Previous position for trajectory line rendering
        const P_PREV_Y = new Float32Array(PLANET_COUNT);
        
        //Initialize planet states from Game.PLANETS
        for (var i = 0; i < PLANET_COUNT; i++) {
            const P = Game.PLANETS[i];
            P_POS_X[i] = P.data.pos.x;
            P_POS_Y[i] = P.data.pos.y;
            P_VEL_X[i] = P.data.vel.x;
            P_VEL_Y[i] = P.data.vel.y;
            P_PREV_X[i] = P_POS_X[i];
            P_PREV_Y[i] = P_POS_Y[i];
        }
        
        //----------------------------------------//
        //INITIALIZE INTERCEPT TRACKING
        //Tracks which planets we're currently near for visual indicator rendering
        //----------------------------------------//
        const IN_INTERCEPT = new Uint8Array(PLANET_COUNT); //Current frame intercept state
        const WAS_IN_INTERCEPT = new Uint8Array(PLANET_COUNT); //Previous frame intercept state
        var drewIntercept = 0; //Did we draw sun intercept this frame?
        var lastDrewIntercept = 0; //Did we draw sun intercept last frame?
        
        //----------------------------------------//
        //INITIALIZE TRAJECTORY STORAGE
        //Raw coordinate objects (x1, y1, x2, y2) for fast batch rendering
        //Organized by planet index for efficient grouped drawing
        //----------------------------------------//
        const TRAJECTORY_SEGS = new Array(PLANET_COUNT);
        for (var i = 0; i < PLANET_COUNT; i++) {
            TRAJECTORY_SEGS[i] = [];
        }
        
        //----------------------------------------//
        //INITIALIZE DRAG INTERPOLATION STATE
        //We calculate drag every N iterations, then interpolate between values
        //This reduces expensive getDrag() calls from 20,000 to 2,000 per trajectory
        //----------------------------------------//
        var lastDragX = 0, lastDragY = 0; //Previous calculated drag
        var nextDragX = 0, nextDragY = 0; //Next calculated drag (for interpolation)
        
        //========================================//
        //HELPER FUNCTION: Render all trajectory segments
        //Draws accumulated trajectory lines for each planet (colored by planet)
        //========================================//
        function renderTrajectories() {
            for (var t = 0; t < PLANET_COUNT; t++) {
                const SEGS = TRAJECTORY_SEGS[t];
                if (SEGS.length === 0) continue; //Skip planets with no trajectory segments
                
                //Draw all segments for this planet using its land color
                Game.renderer.stroke(LAND_COLOUR[t], 2, false, true);
                Game.renderer.beginPath();
                for (var s = 0; s < SEGS.length; s++) {
                    const SEG = SEGS[s];
                    Game.renderer.line(new Vec2(SEG.x1, SEG.y1), new Vec2(SEG.x2, SEG.y2), true, true);
                }
                Game.renderer.strokeShape();
            }
            Player.trajectorySegments = TRAJECTORY_SEGS; //Update trajectory segments for click detection
            Player.clickToTimeWarp();
        }
        
        //========================================//
        //HELPER FUNCTION: Draw impact/reentry marker
        //Shows where player will collide with planet (orange) or fatal reentry (red)
        //Parameters:
        //fatal: true if impact will kill player, false if survivable
        //========================================//
        function drawImpactCircle(posX, posY, fatal) {
            const POS = new Vec2(posX, posY);
            
            //Outer warning ring (always orange)
            Game.renderer.stroke(Colour.rgba(255, 200, 20, 0.8), 10, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(POS, 300, 0, Math.PI * 2, true, true);
            Game.renderer.strokeShape();
            
            //Inner indicator circle (red if fatal, green if survivable)
            const COLOUR = fatal ? Colour.rgba(255, 55, 20, 0.9) : Colour.rgba(100, 220, 50, 0.5);
            Game.renderer.stroke(COLOUR, 5, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(POS, 10, 0, Math.PI * 2, true, true);
            Game.renderer.strokeShape();
        }
        
        //========================================//
        //HELPER FUNCTION: Draw pulsing intercept marker
        //Animates when player enters planet's intercept zone (approach warning)
        //Uses time-based pulsing for dynamic visual effect
        //========================================//
        function drawInterceptMarker(posX, posY) {
            //Calculate pulsing animation parameters
            const PULSE = (Time.seconds % 1) * 0.5; //0 to 0.5 over 1 second
            const PULSE_RAD = clamp(INTERCEPT_CIRCLE_RADIUS - PULSE * 200, 0, INTERCEPT_CIRCLE_RADIUS); //Expanding ring
            const POS = new Vec2(posX, posY);
            const ALPHA = 0.5 - PULSE; //Fade out as ring expands
            
            //Draw static outer circle
            Game.renderer.stroke(Colour.rgb(200, 220, 230), INTERCEPT_CIRCLE_THICKNESS, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(POS, INTERCEPT_CIRCLE_RADIUS, 0, Math.PI * 2, true, true);
            Game.renderer.closePath();
            Game.renderer.strokeShape();
            
            //Draw expanding/pulsing inner circle
            Game.renderer.stroke(Colour.rgba(200, 220, 230, ALPHA), INTERCEPT_CIRCLE_THICKNESS, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(POS, PULSE_RAD, 0, Math.PI * 2, true, true);
            Game.renderer.closePath();
            Game.renderer.strokeShape();
        }
        
        //========================================//
        //MAIN SIMULATION LOOP
        //Integrates physics for future trajectory prediction
        //Each iteration advances simulation by DT seconds
        //========================================//
        for (var i = 0; i < DEPTH; i++) {
            //----------------------------------------//
            //APPLY PLANETARY GRAVITY TO PLANETS
            //Each planet orbits its reference bodies (moons orbit planets, planets orbit sun)
            //Calculate acceleration, then apply to velocity
            //Inlined for performance
            //----------------------------------------//
            for (var p = 0; p < PLANET_COUNT; p++) {
                const REF_BODIES = Game.PLANETS[p].data.referenceBodyNames;
                for (var rb = 0; rb < REF_BODIES.length; rb++) {
                    var idx = -1;
                    for (var pi = 0; pi < PLANET_COUNT; pi++) {
                        if (Game.PLANETS[pi].data.name === REF_BODIES[rb]) { idx = pi; break; }
                    }
                    if (idx === -1) continue; //Reference body not in simulation
                    
                    //Calculate gravitational force on planet p from reference body idx
                    const DX = P_POS_X[idx] - P_POS_X[p];
                    const DY = P_POS_Y[idx] - P_POS_Y[p];
                    const D_SQ = DX * DX + DY * DY;
                    const D = Math.sqrt(D_SQ);
                    const ACCEL = G_DT * PLANET_MASS[idx] / D_SQ * 0.5; //Apply half to avoid double-counting
                    P_VEL_X[p] += DX / D * ACCEL;
                    P_VEL_Y[p] += DY / D * ACCEL;
                }
            }
            
            //----------------------------------------//
            //INTEGRATE PLANET POSITIONS
            //Updated planets now move to new positions (velocity → position)
            //----------------------------------------//
            for (var p = 0; p < PLANET_COUNT; p++) {
                P_POS_X[p] += P_VEL_X[p] * DT;
                P_POS_Y[p] += P_VEL_Y[p] * DT;
            }

            //----------------------------------------//
            //APPLY PLANETARY GRAVITY TO PLANETS (second half)
            //Complete the velocity Verlet integration with second gravity pass
            //----------------------------------------//
            for (var p = 0; p < PLANET_COUNT; p++) {
                const REF_BODIES = Game.PLANETS[p].data.referenceBodyNames;
                for (var rb = 0; rb < REF_BODIES.length; rb++) {
                    var idx = -1;
                    for (var pi = 0; pi < PLANET_COUNT; pi++) {
                        if (Game.PLANETS[pi].data.name === REF_BODIES[rb]) { idx = pi; break; }
                    }
                    if (idx === -1) continue;
                    
                    //Apply second half of gravitational acceleration
                    const DX = P_POS_X[idx] - P_POS_X[p];
                    const DY = P_POS_Y[idx] - P_POS_Y[p];
                    const D_SQ = DX * DX + DY * DY;
                    const D = Math.sqrt(D_SQ);
                    const ACCEL = G_DT * PLANET_MASS[idx] / D_SQ * 0.5;
                    P_VEL_X[p] += DX / D * ACCEL;
                    P_VEL_Y[p] += DY / D * ACCEL;
                }
            }
            
            //----------------------------------------//
            //PHASE 2: APPLY PLANETARY GRAVITY TO PLAYER
            //Player is pulled toward all planets with mass
            //Also check for collision with planets that have land
            //----------------------------------------//
            for (var p = 0; p < PLANET_COUNT; p++) {
                const DX = P_POS_X[p] - posX;
                const DY = P_POS_Y[p] - posY;
                const D_SQ = DX * DX + DY * DY;
                const D = Math.sqrt(D_SQ);
                const ACCEL = G_DT * PLANET_MASS[p] / D_SQ;
                velX += DX / D * ACCEL;
                velY += DY / D * ACCEL;
                
                //Check if player has collided with this planet
                if (HAS_LAND[p] && D_SQ < PLANET_RAD_SQRD[p]) {
                    renderTrajectories(); //Display trajectory up to impact point
                    
                    //Only show impact circle if collision is near player's starting position
                    const PDIST = (PLAYER_POS.x - posX) * (PLAYER_POS.x - posX) + (PLAYER_POS.y - posY) * (PLAYER_POS.y - posY);
                    if (PDIST < MIN_DIST_FOR_IMPACT_MARKER_SQRD) return; //Don't spam markers for old impacts
                    
                    //Calculate impact fatality: relative velocity and angle matter
                    const REL_X = velX - P_VEL_X[p];
                    const REL_Y = velY - P_VEL_Y[p];
                    const DELTA_X = DX / D; //Normalized surface normal
                    const DELTA_Y = DY / D;
                    drawImpactCircle(posX - P_POS_X[p] + START_POS_X[p], posY - P_POS_Y[p] + START_POS_Y[p], 
                        Player.isImpactFatal(new Vec2(REL_X, REL_Y), new Vec2(DELTA_X, DELTA_Y)));
                    return; //Exit trajectory simulation after collision
                }
            }
            
            //----------------------------------------//
            //PHASE 3: INTEGRATE PLAYER POSITION
            //Player position updated based on current velocity
            //----------------------------------------//
            posX += velX * DT;
            posY += velY * DT;
            
            //----------------------------------------//
            //PHASE 4: APPLY ATMOSPHERIC DRAG
            //Drag reduces player velocity; only applies in atmospheres
            //Calculated every N iterations and interpolated for performance
            //----------------------------------------//
            if (i % DRAG_CALC_INTERVAL == 0) {
                lastDragX = nextDragX;
                lastDragY = nextDragY;
                
                //Find closest planet using SIMULATED positions (not real planet data)
                let closestIdx = 0;
                let closestDistSq = Infinity;
                for (let p = 0; p < PLANET_COUNT; p++) {
                    const DX = P_POS_X[p] - posX;
                    const DY = P_POS_Y[p] - posY;
                    const DIST_SQ = DX * DX + DY * DY;
                    if (DIST_SQ < closestDistSq) {
                        closestDistSq = DIST_SQ;
                        closestIdx = p;
                    }
                }
                
                //Calculate drag using simulated planet data and abstractred drag function
                //Convert player direction to vector form for drag calculation
                const DIR_X = Math.sin(Player.dir);
                const DIR_Y = Math.cos(Player.dir);
                
                const CLOSEST_PLANET = Game.PLANETS[closestIdx];
                const DRAG = Player.calculateDragForceComponents(
                    posX, posY, velX, velY,
                    CLOSEST_PLANET.atmosphere,
                    P_POS_X[closestIdx], P_POS_Y[closestIdx],
                    P_VEL_X[closestIdx], P_VEL_Y[closestIdx],
                    DIR_X, DIR_Y
                );
                
                nextDragX = DRAG.x;
                nextDragY = DRAG.y;
            }
            //Interpolate between last calculated and next calculated drag values
            const FRACT = (i % DRAG_CALC_INTERVAL) / DRAG_CALC_INTERVAL;
            const DRAG_X = lastDragX + (nextDragX - lastDragX) * FRACT;
            const DRAG_Y = lastDragY + (nextDragY - lastDragY) * FRACT;
            velX += DRAG_X * DT;
            velY += DRAG_Y * DT;
            
            //========================================//
            //CACHE FOR RENDERING
            //Draw trajectory segments and markers for current simulation step
            //========================================//
            
            //Get sun position for trajectory rendering
            const SUN_X = P_POS_X[startSunIdx];
            const SUN_Y = P_POS_Y[startSunIdx];
            
            //----------------------------------------//
            //Check if player is intercepting any planets (within detection radius)
            //Add trajectory segments for planets under intercept, clear for those not
            //----------------------------------------//
            for (var p = 0; p < PLANET_COUNT; p++) {
                if (p == startSunIdx) continue; //Handle sun separately below
                
                const PX = P_POS_X[p];
                const PY = P_POS_Y[p];
                const DX = PX - posX;
                const DY = PY - posY;
                const D_SQ = DX * DX + DY * DY;
                
                //Check if player is within planet's intercept detection radius
                if (D_SQ < THRESH_SQRD[p]) {
                    IN_INTERCEPT[p] = 1;
                    drewIntercept = 1;
                    
                    //Add trajectory segment (line from last frame to current)
                    TRAJECTORY_SEGS[p].push({
                        x1: posX - PX + START_POS_X[p],
                        y1: posY - PY + START_POS_Y[p],
                        x2: lastPosX - P_PREV_X[p] + START_POS_X[p],
                        y2: lastPosY - P_PREV_Y[p] + START_POS_Y[p],
                        time: i * DT 
                    });
                } else {
                    IN_INTERCEPT[p] = 0; //Not in intercept zone
                }
            }
            
            //----------------------------------------//
            //Draw intercept markers when entering/exiting planet intercept zones
            //Pulsing animation indicates approach warning
            //----------------------------------------//
            for (var p = 0; p < PLANET_COUNT; p++) {
                //Only draw marker when intercept state CHANGED (entering or leaving)
                if (IN_INTERCEPT[p] !== WAS_IN_INTERCEPT[p] && i > 0) {
                    //Draw markers for all planets currently being intercepted
                    for (var p2 = 0; p2 < PLANET_COUNT; p2++) {
                        if (IN_INTERCEPT[p2]) {
                            drawInterceptMarker(posX - P_POS_X[p2] + START_POS_X[p2], posY - P_POS_Y[p2] + START_POS_Y[p2]);
                        }
                    }
                    drawInterceptMarker(posX - P_POS_X[p] + START_POS_X[p], posY - P_POS_Y[p] + START_POS_Y[p]);
                }
            }
            
            //----------------------------------------//
            //Draw sun intercept marker (only if not intercepting other planets)
            //Sun is the default trajectory target when far from other bodies
            //----------------------------------------//
            if (drewIntercept !== lastDrewIntercept && i > 0) {
                drawInterceptMarker(posX - SUN_X + START_POS_X[startSunIdx], posY - SUN_Y + START_POS_Y[startSunIdx]);
            }
            
            //----------------------------------------//
            //Add trajectory segment toward sun if not intercepting other planets
            //This is the main trajectory line shown when on open trajectory
            //----------------------------------------//
            if (!drewIntercept) {
                TRAJECTORY_SEGS[startSunIdx].push({
                    x1: posX - SUN_X + START_POS_X[startSunIdx],
                    y1: posY - SUN_Y + START_POS_Y[startSunIdx],
                    x2: lastPosX - P_PREV_X[startSunIdx] + START_POS_X[startSunIdx],
                    y2: lastPosY - P_PREV_Y[startSunIdx] + START_POS_Y[startSunIdx],
                    time: i * DT 
                });
            }
            
            //----------------------------------------//
            //Check for dangerous reentry conditions
            //If heat exceeds tolerance, player will die - show fatal impact warning
            //----------------------------------------//
            const CURRENT_DRAG_MAG = Math.sqrt(DRAG_X * DRAG_X + DRAG_Y * DRAG_Y);
            const HEAT_SCALE = CURRENT_DRAG_MAG / Difficulty.Player.REENTRY_TOLERANCE;
            if (HEAT_SCALE >= 1) {
                //Player will burn up in reentry
                if (i < SECONDS_BEFORE_DEATH * 60) Player.mightExplodeOnReentry = true;
                
                //Show fatal impact circles for any planets in intercept zone
                for (var p = 0; p < PLANET_COUNT; p++) {
                    if (IN_INTERCEPT[p]) {
                        drawImpactCircle(posX - P_POS_X[p] + START_POS_X[p], posY - P_POS_Y[p] + START_POS_Y[p], true);
                    }
                }
                
                renderTrajectories();
                return; //Exit simulation - trajectory ends in fatal reentry
            } else {
                Player.mightExplodeOnReentry = false;
            }
            
            //----------------------------------------//
            //UPDATE STATE FOR NEXT ITERATION
            //Store current position as 'previous' so we can draw line segments
            //Update intercept state tracking for next frame's comparison
            //----------------------------------------//
            lastPosX = posX;
            lastPosY = posY;
            for (var p = 0; p < PLANET_COUNT; p++) {
                P_PREV_X[p] = P_POS_X[p];
                P_PREV_Y[p] = P_POS_Y[p];
                WAS_IN_INTERCEPT[p] = IN_INTERCEPT[p];
            }
            lastDrewIntercept = drewIntercept;
            drewIntercept = 0; //Reset for next iteration
        }
        
        //Render final trajectory (if simulation completed without collision/reentry)
        renderTrajectories();
    }
    
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //discoverPlanet(planetIdx)
    //Mark the planet at 'Game.PLANETS[planetIdx]' as discovered
    //Increment player score
    static discoverPlanet(planetIdx) {
        if (Game.PLANETS[planetIdx].data.discovered) return; //Can't discover a planet twice
        Game.PLANETS[planetIdx].data.discovered = true; //mark as discovered
        const VALUE = (1000 / Game.PLANETS[planetIdx].data.radius);
        Player.score += VALUE * 600; //Increase score (more points for smaller planets)
        Player.fuel = clamp(Player.fuel + VALUE * 25, 0, Difficulty.Player.MAX_FUEL);
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //die()
    //kill the player!
    static die() {
        Player.deathCounter = 1;
        State.setState(Game.SCORE_STATE_ID, Player.score); //So that the game page knows what score the player got
        Player.smoothScore = Player.score; //Don't confuse the player by showing the wrong score!
        Player.zoom = 5;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //explode()
    //spawns two rings of explosion particles, deletes the player image
    static explode() {
        //Don't explode when the game is still starting
        if (Time.seconds < Player.IMMUNITY_TIME) return;

        Player.exploded = true;
        const NUM_PARTICLES = 80;
        const SPEED = 5;
        const INNER_SPEED = 1;
        const RANDOMNESS = 0.5;
        spawnExplosion(Player.pos, Player.vel, INNER_SPEED, SPEED, NUM_PARTICLES, RANDOMNESS, Colour.rgba(250,150,100,1), Colour.rgba(255, 72, 0, 0.5), Colour.rgba(151, 151, 151, 0))
        
        Player.die();//Die!!!
    }
    //----------------------------------------------------------------------//
}
//END OF Player
//----------------------------------------------------------------------//
