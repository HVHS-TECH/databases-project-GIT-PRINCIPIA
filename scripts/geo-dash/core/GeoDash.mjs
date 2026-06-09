/*******************************************************/
// P5.play: A simple game
// 
// This game can be used as an extra game for the 12COMP
// and 13COMP Databases assessments
//
// Written by Mr Britton
/*******************************************************/


import { HighScoreManager } from "../../data/high_score_manager.mjs";
import { FB_Login } from "../../data/firebase/fb_login.mjs";
import { FB_Init } from "../../data/firebase/fb_init.mjs";

FB_Init.init();
window.setup = setup;
window.draw = draw;

console.log("Running the game");

// End game code
function endGame(_player, _obstacle){
    console.log("Game ended, you got "+score+" points.")
    screenSelector = "end";
    player.remove();
    obstacles.removeAll();
    // Put your database writes here:
    FB_Login.login(()=>{

        const HIGH_SCORE = HighScoreManager.getHighScore(checkHighScore, 'geoDash');
    });
}

function checkHighScore(HIGH_SCORE) {
    if (score > HIGH_SCORE) {
        HighScoreManager.setHighScore(score, 'geoDash');
    }
}

































const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 300;
const PLAYER_HEIGHT = 25;
const PLAYER_WIDTH = 25;


const OBSTACLE_HEIGHT = PLAYER_HEIGHT;
const OBSTACLE_WIDTH = PLAYER_WIDTH;

var spawnDist = 0;
var nextSpawn = 0;
var score = 0;
var player;

var screenSelector = "start";  

var obstacles;

/*******************************************************/
// setup()
/*******************************************************/
function setup() {
    var cnv= new Canvas(SCREEN_WIDTH, SCREEN_HEIGHT);
    document.getElementById("q5Canvas0").classList.add("has-border");
    obstacles = new Group();

    var floor =  new Sprite(SCREEN_WIDTH/2,  SCREEN_HEIGHT, SCREEN_WIDTH, 4, 's');
    floor.color = color("black");
    world.gravity.y = 80;
    
    document.addEventListener("keydown", 
        function(event) {
            if(screenSelector == "start"||screenSelector == "end"){
                screenSelector = "game"
                resetGame();
            }else{
                if(player.y > 175 * 3/2 ){// 184 - found from testing - floor level
                    player.vel.y = -20;
                }
            }
    });

}

/*******************************************************/
// draw()
/*******************************************************/
function draw() {
    if(screenSelector=="game"){
        gameScreen();
    }else if(screenSelector=="end"){
        endScreen();
    }else if(screenSelector=="start"){
        startScreen();
    }else{
        text("wrong screen - you shouldnt get here", 75, 75);
        console.log("wrong screen - you shouldnt get here")
    }
}

function newObstacle(){
    var obstacle = new Sprite((SCREEN_WIDTH + 75),  SCREEN_HEIGHT - OBSTACLE_HEIGHT/2, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, 'k');
    obstacle.color = color("yellow");
    obstacle.vel.x = -10;
    
    obstacles.add(obstacle);
}

// Main screen functions

function startScreen(){
    background(3, 45, 38);

    allSprites.visible = false;
    textSize(48);
    fill(255, 237, 163);
    stroke(0);
    strokeWeight(4);
    text("Welcome to the game", 75, 75);
    textSize(36);
    text("Press any key to start", 75, 165);    textSize(36);
    text("Press space to jump", 75, 225);
}

function gameScreen(){
    background("#C39BD3");
    allSprites.visible = true;
    score++;
    if(frameCount> nextSpawn){
        newObstacle();
        nextSpawn = frameCount + random(10,100);
    }
    textSize(32);
    fill(255, 237, 163);
    stroke(0);
    strokeWeight(4);
    text(score, 50, 50);
}

function endScreen(){
    background(3, 45, 38);

    allSprites.visible = false;
    textSize(32);
    fill(255, 237, 163);
    stroke(0);
    strokeWeight(4);
    text("You died! Too bad :-(", 50, 50);
    textSize(24);
    text("your score was: "+score, 50, 110);
    textSize(14);
    text("press any key to restart", 50, 150);
}

function resetGame(){
    player = new Sprite(PLAYER_WIDTH*1.2,  SCREEN_HEIGHT/2, PLAYER_WIDTH, PLAYER_HEIGHT, 'd');
    player.color = color("purple");
    player.collides(obstacles, endGame);
    score = 0;
}

/*******************************************************/
//  END OF APP
/*******************************************************/