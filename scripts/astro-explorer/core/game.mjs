//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game class                                                            //
//Handles game logic, controls other classes                            //
//----------------------------------------------------------------------//



import { Renderer } from "./renderer.mjs";
import { Planet } from "./planet.mjs";
import { Page, Vec2, RefVar, Colour, lerp } from "../../utility/miscellaneous.mjs";
import { Player } from "./player.mjs";
import { Input } from "../interface/input.mjs";
import { UIelement } from "../interface/ui/ui_element.mjs";
import { Navball } from "../interface/ui/navball.mjs";
import { VertMeter } from "../interface/ui/vert_meter.mjs";
import { Text } from "../interface/ui/text.mjs";
import { Container } from "../interface/ui/container.mjs";
import { Dropdown } from "../interface/ui/dropdown.mjs";

import { Loader } from '../../data/loader.mjs'

import { Particle } from "../interface/ui/particle.mjs";

import { Time } from "../../utility/time.mjs";

import { State } from "../../data/state.mjs";

import { Difficulty } from "../../data/difficulty.mjs";
import { Button } from "../interface/ui/button.mjs";

import { HighScoreManager } from "../../data/high_score_manager.mjs";
import { FB_User } from "../../data/firebase/fb_data.mjs";

//----------------------------------------------------------------------//
//Game class - handles game loop and core logic
export class Game {

    static HOME_TITLE = "Astro Explorer - Title Screen";
    static GAME_TITLE = "Astro Explorer";
    static END_TITLE = "Astro Explorer - End Screen";
    

    //----------------------------------------------------------------------//
    //Planets
    static PLANETS = [];

    //The game renderer
    static renderer = new Renderer(); 
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //A list of the pages that make up the game. Each one has a title, a href, a 'hasCnv' boolean, and an onLoad() function
    //HREF is from root directory
    static PAGES = [
        new Page(Game.HOME_TITLE, "/html/astro-explorer/start.html", false,
            async function () {
                console.log("home page load");
                console.dir(FB_User);

                var value = (await HighScoreManager.getHighScore(
                    ()=>{},
                    'astroExplorer'
                ));

                if (value == null) value = 0;
                var highScoreElem = document.getElementById("high_score");
                highScoreElem.innerText = "High Score: " + Math.round(Number(value));
                
            }
        ),


        new Page(Game.GAME_TITLE, "/html/astro-explorer/game.html", true,
            function () {

            }
        ),


        new Page(Game.END_TITLE, "/html/astro-explorer/end.html", false,
            function () {
                //OnLoad
                //called on page load

                const DEATH_STATE = State.getState(Game.DEATH_STATE_ID);
                const SCORE_STATE = State.getState(Game.SCORE_STATE_ID);
                var highScoreState = HighScoreManager.getHighScore(
                    (value)=>{
                        var highScoreState = value;
                        var isHighScoreNew = false;
                        //manage high score
                        if (highScoreState == null) {
                            //no high score
                            highScoreState = SCORE_STATE;
                            isHighScoreNew = true;
                            //Apply changes to high score
                            HighScoreManager.setHighScore(highScoreState, 'astroExplorer');
                        } else {
                            //there is a high score
                            if (Number(SCORE_STATE) > Number(highScoreState)) {
                                highScoreState = SCORE_STATE;
                                isHighScoreNew = true;
                                //Apply changes to high score
                                HighScoreManager.setHighScore(highScoreState, 'astroExplorer');
                            }
                        }
                        

                        var deathReasonElem = document.getElementById("death_reason");
                        var scoreElem = document.getElementById("score");
                        var highScoreElem = document.getElementById("high_score");

                        deathReasonElem.textContent = "You " + DEATH_STATE + "!";
                        scoreElem.textContent = "Score: " + Math.round(SCORE_STATE);
                        var highScoreMessage = "Previous High Score: " + Math.round(highScoreState);
                        if (isHighScoreNew) {
                            highScoreMessage = "High Score: " + Math.round(highScoreState) + " (NEW!)";
                        }
                        highScoreElem.textContent = highScoreMessage;
                    },
                    'astroExplorer'
                );
                
            }
        )

    ];
    //----------------------------------------------------------------------//




    //----------------------------------------------------------------------//
    //The UI elements that make up the screen
    static UI_ELEMENTS = [
        //----------------------------------------------------------------------//
        //fuel
        new VertMeter(new Vec2(-80,0), 'right', 80, 700, Colour.rgb(100, 0, 0), Colour.rgb(85, 255, 0), Colour.rgb(0, 140, 255), 5, "PlayerFuel"), //Fuel
        
        //heat
        new VertMeter(new Vec2(80,0), 'left', 80, 700, Colour.rgb(20, 68, 20), Colour.rgb(255, 128, 0), Colour.rgb(0, 140, 255), 5, "PlayerHeat"),  //Heat
        
        //navball
        new Navball(new Vec2(0, 180), 'bottom', 160, Colour.rgb(200, 200, 200), Colour.rgb(50, 75, 100), Colour.rgb(34, 52, 70), Colour.rgb(200, 200, 200), Colour.rgb(255, 255, 255), Colour.rgb(21, 51, 33), 15, 25, "monospace", "PlayerVel", "PlayerVelDir"), //Navball
        //----------------------------------------------------------------------//


        //----------------------------------------------------------------------//
        //top dropdown
        new Dropdown(new Vec2(0, 80), 'top', 400, 150, 150, 0, 10, 
            function(){ //Function that determines if it should toggle (must do the toggling)
                const DROPDOWN = this.MousedOver(this.loweredPos);
                if (DROPDOWN) {
                    this.targetDropdownValue = 1;
                } else {
                    this.targetDropdownValue = 0;
                }
            }, 
            new Container(new Vec2(0, 0), 'center', 900, 150, Colour.rgb(255, 241, 179), Colour.rgb(41, 2, 32), 10, 
                [
                    //----------------------------------------------------------------------//
                    //Help information
                    new Text(new Vec2(0,0), 'center', 900, 125, Colour.rgb(0, 0, 0), 23, "monospace", 'center', 'middle', "HelpText"),
                    //----------------------------------------------------------------------//

                    //----------------------------------------------------------------------//
                    //Container for score text
                    new Container(new Vec2(-200, -35), 'bottom', 450, 70, Colour.rgb(241, 222, 135), Colour.rgb(39, 36, 39), 5,
                        [   //Score text is rendered in a container located below the dropdown
                            new Text(new Vec2(0,0), 'center', 300, 125, Colour.rgb(0, 0, 0), 60, "monospace", "center", "middle", "PlayerScore")
                        ]
                        ),
                    
                    //----------------------------------------------------------------------//

                    //----------------------------------------------------------------------//
                    //Prompt text telling the user that the help information above exists
                    new Container(new Vec2(200, -20), 'bottom', 200, 40, Colour.rgb(241, 222, 135), Colour.rgb(39, 36, 39), 5,
                        [   //Text
                            new Text(new Vec2(0,0), 'center', 300, 125, Colour.rgb(0, 0, 0), 25, "monospace", 'center', 'middle', "HelpTextPromptText")
                        ]
                    )
                    //----------------------------------------------------------------------//
                    
                ]
            )
        ),
        //----------------------------------------------------------------------//


        //----------------------------------------------------------------------//
        //escape / pause menu
        new Dropdown(
            new Vec2(0,0),
            'center',
            500,
            750,
            0, //Since the dropdown distance varies with screen size, it is constantly calculated in CheckToToggle() (defined below)
            1, //starts dropped down
            10, //time to drop down
            function(){ //Called every frame, should the dropdown toggle?
                if (Input.KeyDown("Escape")) {
                    this.ToggleDroppedDown();
                    if (this.targetDropdownValue < 1) {
                        Game.paused = true;
                    } else {
                        Game.paused = false;
                    }
                }
                if (Game.paused) {
                    this.targetDropdownValue = 0;
                }
                else {
                    this.targetDropdownValue = 1;
                }

                //Make sure the dropdown is always off screen when dropped-down
                this.dropdownDist = Game.renderer.cnvHeight + this.height;
                this.loweredPos = this.raisedPos.sub(new Vec2(0,this.dropdownDist));
                
            },
            //Pause menu container
            new Container(
                new Vec2(0,0),
                'center',
                500,
                750,
                Colour.rgba(255, 250, 174, 0.64),
                Colour.rgba(0,0,0,0.2),
                0,
                //Items contained within the pause menu
                [
                    //Title text of pause menu
                    new Text(
                        new Vec2(0, -70),
                        'top',
                        400,
                        200,
                        Colour.rgb(10, 26, 19),
                        80,
                        'monospace',
                        'center',
                        'middle',
                        "GamePausedTitle"
                    ),


                    //Back to game (unpause) button
                    new Button(
                        new Vec2(0, 240),
                        'bottom',
                        //Dimensions

                        //Width
                        400,

                        //Height
                        60,

                        //Background
                        Colour.rgb(26, 61, 44),
                        Colour.rgb(2, 34, 27),

                        //Outline
                        Colour.rgb(0,0,0),
                        Colour.rgb(0,0,0),

                        5,
                        0.9,
                        [
                            new Text(
                                new Vec2(0,0),
                                'center',
                                300,
                                80,
                                Colour.rgb(252, 235, 179),
                                40,
                                'monospace',
                                'center',
                                'middle',
                                "BackToGameText"
                            )
                        ],
                        //Restart the game when button clicked
                        function(){Game.paused = false}
                    ),


                    //Restart game button
                    new Button(
                        new Vec2(0, 160),
                        'bottom',
                        //Dimensions

                        //Width
                        300,

                        //Height
                        60,

                        //Background
                        Colour.rgb(26, 61, 44),
                        Colour.rgb(2, 34, 27),

                        //Outline
                        Colour.rgb(0,0,0),
                        Colour.rgb(0,0,0),

                        5,
                        0.9,
                        [
                            new Text(
                                new Vec2(0,0),
                                'center',
                                300,
                                80,
                                Colour.rgb(252, 235, 179),
                                40,
                                'monospace',
                                'center',
                                'middle',
                                "RestartGameText"
                            )
                        ],
                        //Restart the game when button clicked
                        function(){Game.Restart();}
                    ),

                    //Quit to main menu button
                    new Button(
                        new Vec2(0, 80),
                        'bottom',
                        //Dimensions

                        //Width
                        400,

                        //Height
                        60,

                        //Background
                        Colour.rgb(26, 61, 44),
                        Colour.rgb(2, 34, 27),

                        //Outline
                        Colour.rgb(0,0,0),
                        Colour.rgb(0,0,0),

                        5,
                        0.9,
                        [
                            new Text(
                                new Vec2(0,0),
                                'center',
                                300,
                                80,
                                Colour.rgb(252, 235, 179),
                                40,
                                'monospace',
                                'center',
                                'middle',
                                "QuitToMainMenuText"
                            )
                        ],
                        //Quit to main menu
                        function(){Game.setPage(Game.HOME_TITLE);}
                    ),


                    //Pause menu help text
                    new Text(
                        new Vec2(0,-100),
                        'center',

                        400, 800,
                        
                        Colour.rgb(0,0,0), 20, 'monospace',

                        'center', 'top',

                        "PauseHelpText"
                    )
                ]
            )
        )
        //----------------------------------------------------------------------//
    ];
    //----------------------------------------------------------------------//

    

    //----------------------------------------------------------------------//
    //                                   num particle slots
    //                                          ||
    //The particles that exist in the world     ||
    //Initialize an array of null with length   \/
    static PARTICLES = Array.apply(null, Array(3000).map(function(){}));
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //References to other variables for flexibility
    static REF_VARIABLES = [
        new RefVar(
            "PlayerFuel",
            function() { //Get
                return Player.fuel / Difficulty.Player.MAX_FUEL;
            }
        ),
        new RefVar(
            "PlayerHeat",
            function() { //Get
                return Player.getHeat(Player.pos, Player.vel);
            }
        ),
        new RefVar(
            "PlayerVel",
            function() { //Get
                //Get the velocity relative to the closest planet
                var vel = Player.vel;
                var closest_planet = Game.getClosestPlanet(Player.pos, true);
                vel = vel.sub(Game.PLANETS[closest_planet].data.vel);
                return vel.len(); 
            }
        ),
        new RefVar(
            "PlayerVelDir",
            function() { //Get
                //Get the velocity relative to the closest planet
                var vel = Player.vel;
                var closest_planet = Game.getClosestPlanet(Player.pos, true);
                vel = vel.sub(Game.PLANETS[closest_planet].data.vel);
                return vel.dir();
            }
        ),
        new RefVar(
            "PlayerScore",
            function() { //Get
                return "SCORE: " + Math.round(Player.smoothScore);
            }
        ),
        new RefVar(
            "HelpText", //The help text displayed above score
            function() { //Get
                return "Controls: \n" + 
                "Movement: W => move forward, A => rotate left, D => rotate right \n" + 
                "Other: Space => speed up time, Arrow up / down => zoom \n" + 
                "R => restart game, Escape => toggle pause / help menu";
            }
        ),
        new RefVar(
            "HelpTextPromptText", //A small text box beside score prompting the user to move their mouse up and activate the dropdown to reveal the help text
            function() { //Get
                return "↑ CONTROLS ↑";
            }
        ),
        new RefVar(
            "GamePausedTitle", //Title of the game paused menu
            function() { //Get
                return "Game Paused";
            }
        ), 
        new RefVar(
            "QuitToMainMenuText", //Text displayed in pause menu quit to main menu button
            function() { //Get
                return "Quit To Main Menu";
            }
        ),
        new RefVar(
            "RestartGameText", //Text displayed in pause menu restart game button
            function() { //Get
                return "Restart Game";
            }
        ),
        new RefVar(
            "BackToGameText",
            function() { //Get
                return "Back To Game";
            }
        ),
        new RefVar(
            "PauseHelpText", //Help text in pause menu
            function() { //Get
                return (
                "LANDING ON PLANETS:\n\n" +

                "Make sure to not come down\n" + 
                "too fast, or you\n" +
                "will explode.\n\n" + 

                "On top of this, if you are\n" + 
                "moving sideways too fast\n" + 
                "you may tip over.\n\n" + 

                "GETTING TO PLANETS:\n\n" + 

                "Since, by the time you reach\n" + 
                "a planet, it will have moved by\n" +
                "some amount, you need to be\n" +
                "careful to aim your trajectory\n" +
                "to intersect with the planet's\n" +
                "future position, not its current\n" +
                "position."
                );
            }
        )
    ];
    //----------------------------------------------------------------------//

     
    //----------------------------------------------------------------------//
    static G = 0.005; //Universal gravitational constant

    static timewarp = 1;
    static smoothTimeWarp = 1;

    //The ID returned by requestAnimationFrame(), used to stop the game loop
    static animationFrameID = 0;

    //Is the game paused?
    static paused = false;

    //Cooldown for debug toggles
    static DEBUG_TOGGLE_COOLDOWN_TIME = 0.5; //Seconds
    static debugToggelCooldown = 0;
    //----------------------------------------------------------------------//

    //state id-s
    //the names of the states that make up the game
    static DEATH_STATE_ID = "GAME_OVER-status";
    static SCORE_STATE_ID = "GAME_OVER-score";
    static HIGH_SCORE_ID = "GAME-high-score";
    

    //----------------------------------------------------------------------//
    //Start()
    //called on page load
    static Start() {

        console.log("Game.Start");


        console.log("Game.Start: initializing");

        Game.initializeState();
        Player.Initialize();

        //----------------------------------------//
        //Only try to load planets / particles if the page has a canvas to display them
        //hasCnv is initialized in Game.initializeState()
        if (Game.renderer.hasCnv) {
            Game.PLANETS = Loader.LoadPlanets(); //Also initializes player position and velocity to starting planet
            for (var i = 0; i < Game.PARTICLES.length; i++) {
                Game.PARTICLES[i] = new Particle(new Vec2(0,0), 0, new Vec2(0,0), 0, 0, Colour.rgb(0,0,0), Colour.rgb(0,0,0), Colour.rgb(0,0,0), -1, function(){}, function(){});
            }
        }
        //----------------------------------------//
        
        
        Input.Initialize();

        //----------------------------------------//
        //Prevent scaleDeltaTime from being VERY large on the first frame due to planet loading etc
        Time.seconds = 0;
        Time.frame = 0;
        Time.Update();
        Time.Update();
        Time.Update();
        //----------------------------------------//
        
        console.log("Game.Start: initialized");
        Game.paused = false;
        Game.timewarp = 1;
        
        Game.animationFrameID = setTimeout(Game.Update, 0);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Restart()
    //cancels the game loop, and calls start
    static Restart() {
        //Currently, the last Game.Update() callback is waiting to be called. 
        //If we do not cancel it, we will have two game loops running
        clearTimeout(Game.animationFrameID);
        //Reset UI element dropdown values
        for (var i = 0; i < Game.UI_ELEMENTS.length; i++) {
            var element = Game.UI_ELEMENTS[i];
            if (element instanceof Dropdown) {
                //Element is a dropdown, reset its target state (don't reset its state, it looks nice to have it animate back to the original state)
                element.targetDropdownValue = element.startDropdownState;
            }
        }

        //Update high score on game restart AS WELL AS game end (defined elsewhere)
        if (Player.score > Number(State.getState(Game.HIGH_SCORE_ID))) {
            State.setState(Game.HIGH_SCORE_ID, Player.score);
        }

        //Start game again
        Game.Start();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    //manages game logic, then renders scene using renderer
    static Update() {
        if (!Game.renderer.hasCnv) return; //No canvas, nothing to update
        //Handle debug modes
        if (Game.debugToggelCooldown > Game.DEBUG_TOGGLE_COOLDOWN_TIME) {
            if (Input.KeyDown("KeyG")) State.updatePlayer = !State.updatePlayer;
            if (Input.KeyDown("Period")) State.debugMode = !State.debugMode;
            Game.debugToggelCooldown = 0;
        } else {
            Game.debugToggelCooldown += Time.deltaTime;
        }
        

        const TIMEWARP_SMOOTHING = 0.2;
        Game.smoothTimeWarp = lerp(Game.smoothTimeWarp, Game.timewarp, TIMEWARP_SMOOTHING);

        //---TIMEWARP---
        //If time warp is an integer (e.g 2) we can just integrate twice
        //If, however, time warp is NOT an integer, (e.g 2.5) we must:
        //
        // - update an integer number of times (e.g 2)
        //
        // - set dt to an appropriate value to manage the decimal part of the timewarp value
        //   (e.g 1.25)

        
        //Can't go below 1
        const INTEGER_PORTION = Math.max(Math.floor(Game.smoothTimeWarp), 1);

        const DT = Time.scaleDeltaTime * (Game.smoothTimeWarp / INTEGER_PORTION);
        if (!Game.paused) {
            //only update if the game is paused
            for (var k = 0; k < INTEGER_PORTION; k++) {
                //----------------------------------------//
                //Use verlet velocity integration to reduce integration error
                for (var p = 0; p < Game.PLANETS.length; p++) {
                    Game.PLANETS[p].Update(DT, Game.PLANETS);
                }
                for (var p = 0; p < Game.PLANETS.length; p++) {
                    Game.PLANETS[p].Integrate(DT);
                }
                for (var p = 0; p < Game.PLANETS.length; p++) {
                    Game.PLANETS[p].Update(DT, Game.PLANETS);
                }
                //----------------------------------------//

                

                for (var i = 0; i < Game.PARTICLES.length; i++) {
                    if (Game.PARTICLES[i].frame < Game.PARTICLES[i].lifetime) {
                        //Particle is alive, update
                        Game.PARTICLES[i].Update(DT);
                    }
                    
                }

                if (State.updatePlayer) Player.Update(DT);

            }
        }
        for (var e = 0; e < Game.UI_ELEMENTS.length; e++) {
                Game.UI_ELEMENTS[e].Update();
            }
        
        Time.Update();
        if (Input.KeyDown("KeyG")) {
            Game.UI_ELEMENTS[3].ToggleDroppedDown();
        }
        Game.renderer.Render();

        Game.animationFrameID = setTimeout(Game.Update, 0);
    }
    //----------------------------------------------------------------------//
    

    //----------------------------------------------------------------------//
    //setPage(title)                                      
    //sets the current page to the href of the page in PAGES with
    //the title 'title'                                            
    static setPage(title) {
        var p = Game.getPage(title);
        var origin = window.location.origin; 
        if (origin == 'https://hvhs-tech.github.io') {
            //We are on the pages site
            origin = "https://hvhs-tech.github.io/databases-project-GIT-PRINCIPIA";
        }
        
        var href = origin + Game.PAGES[p].href;
        window.location.href = href;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //initializeState(title)     
    //title: the title of the page      
    //sets the state based on 'title'   
    //defualts to current page title  
    static initializeState(title = document.title) {
        var p = Game.getPage(title);
        Game.PAGES[p].OnLoad();
        Game.renderer.hasCnv = Game.PAGES[p].hasCnv;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Helper functions
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //getPage(title)                               
    //Gets the index into PAGES pointer to the page
    //with the title 'title'                         
    //defualts to current page title               
    static getPage(title = document.title) {
        var p;
        for (p = 0; p < Game.PAGES.length; p++) {
            if (Game.PAGES[p].title == title) {
                break;
            }
        }
        return p;
    }
    //----------------------------------------------------------------------//


    
    //----------------------------------------------------------------------//
    //getRefVar(name)
    //returns the return value of the get method of the reference variable with the same name as 'name'
    static getRefVar(name) {
        var r;
        var res = -1;
        for (r = 0; r < Game.REF_VARIABLES.length; r++) {
            if (Game.REF_VARIABLES[r].name == name) {
                res = r;//Track if there is a reference with that name
                break;
            } else {
                res = -1;//Track if there isn't a reference with that name
            } 
        }
        if (res > -1) {
            //A reference was found with name 'name'
            return Game.REF_VARIABLES[r].get();
        } else {
            //Res == -1, so no reference was found with the correct name
            console.warn(
                "Game.getRefVar: there is no variable with name '"
                 + name + 
                 "'\n" +
                "returning 0 - this might break things!");
            return 0;
        }
        
    }
    //----------------------------------------------------------------------//

    
    //----------------------------------------------------------------------//
    //addParticle(particle)
    //adds 'particle' 
    static addParticle(particle) {
        for (var i = 0; i < Game.PARTICLES.length; i++) {
            if (Game.PARTICLES[i].frame >= Game.PARTICLES[i].lifetime) {
                //Particle is dead, reuse slot
                Game.PARTICLES[i] = particle;
                return;
            }
        }
        console.warn("Game.addParticle: No particle slots remaining - replacing last item in array - this might break things!");
        Game.PARTICLES[Game.PARTICLES.length - 1] = particle;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //getClosestPlanet(pos)
    //returns the index of the closest planet
    static getClosestPlanet(pos, subRadius, planets = Game.PLANETS) {
        var closestPlanet = 0;
        var closestPlanetDistSquared = 1000000000000;
        for (var p = 0; p < planets.length; p++) {
            
            const DIST_SQUARED = Vec2.sqrDist(planets[p].data.pos, pos) - ((subRadius) ? planets[p].data.radius * planets[p].data.radius : 0);
            if (DIST_SQUARED < closestPlanetDistSquared) {
                closestPlanet = p;
                closestPlanetDistSquared = DIST_SQUARED;
            }
        }
        return closestPlanet;
    }
    //----------------------------------------------------------------------//
    
}
//END OF Game
//----------------------------------------------------------------------//





