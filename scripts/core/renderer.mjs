//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Renderer class                                                        //
//Manages render functions and canvas setup                             //
//----------------------------------------------------------------------//
import { Player } from './player.mjs';
import { Vec2, Colour } from '../utility/miscellaneous.mjs';
import { Game } from './game.mjs';
import { State } from '../data/state.mjs';
export class Renderer {
    constructor() {
        //----------------------------------------//
        //Initialize the canvas variables
        this.cnvWidth = window.innerWidth;
        this.cnvHeight = window.innerHeight;
        this.scaleCnvSize = 1000; //Size of the virtual canvas - see worldToCanvas();
        this.canvas = document.getElementById("canvas");
        this.hasCnv = true;
        //----------------------------------------//

        //Does the page have a canvas?
        if (this.canvas == null) {
            this.hasCnv = false;
        }
        else {

            //----------------------------------------//
            //Initialize the canvas context
            this.hasCnv = true;
            this.cnv = this.canvas.getContext("2d");
            this.canvas.width = this.cnvWidth;
            this.canvas.height = this.cnvHeight;
            this.cnvHalfDimen = new Vec2(this.cnvWidth / 2, this.cnvHeight / 2);
            //----------------------------------------//


            //----------------------------------------//
            //Set the callbacks
            window.addEventListener('resize', this.cb_windowResized);
            //----------------------------------------//
        }
    }

    //----------------------------------------------------------------------//
    //Render()
    //Renders the scene
    Render() {
        
        //----------------------------------------//
        //Update the dimension variables
        this.cnvWidth = window.innerWidth;
        this.cnvHeight = window.innerHeight; 
        this.cnvHalfDimen = new Vec2(this.cnvWidth / 2, this.cnvHeight / 2);
        //----------------------------------------//


        //----------------------------------------//
        //Background
        this.background(Colour.rgb(0, 0, 0));
        //----------------------------------------//

        
        //----------------------------------------//
        //Render the planets
        for (var p = 0; p < Game.PLANETS.length; p++) {
            Game.PLANETS[p].Draw();
        }
        //----------------------------------------//


        //----------------------------------------//
        //Render the particles that are alive
        for (var p = 0; p < Game.PARTICLES.length; p++) {
            if (Game.PARTICLES[p].frame < Game.PARTICLES[p].lifetime) {
                //Particle is alive, draw
                Game.PARTICLES[p].Draw();
            }
        }
        //----------------------------------------//

        

        //----------------------------------------//
        //Render the player
        Player.Draw();
        //----------------------------------------//
        

        //----------------------------------------//
        //Render the ui elements last so that it appears on top of everything
        for (var e = 0; e < Game.UI_ELEMENTS.length; e++) {
            Game.UI_ELEMENTS[e].Draw();
        }
        //----------------------------------------//


        //----------------------------------------//
        //If applicable, draw debug information
        if (State.debugMode) {
            this.text("height: " + this.cnvHeight + ", virtual canvas size: " + this.scaleCnvSize, 'center', 'middle', 40, 'monospace', new Vec2(0,0), false, true);
        }
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //background(style)
    //sets the background style (colour)
    background(style) {
        this.fill(style);
        this.cnv.rect(0, 0, this.cnvWidth, this.cnvHeight);
        this.fillShape();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //radGradient(start, end, inner, outer)                  
    //returns a radial gradient based on the start and end positions and radii    
    //start: start pos
    //end: end pos
    //inner: start radius
    //outer: end radius   
    //playerRelative: is the point relative to the player
    //scale: should the function manage alignment and screen size scaling?
    radGradient(start, end, inner, outer, playerRelative, scale) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.radGradient called on a page with no canvas. This might break things.");
            return null;
        }

        //----------------------------------------//
        //Transform the variables to canvas space
        start = this.worldToCanvas(start, playerRelative, scale);
        end = this.worldToCanvas(end, playerRelative, scale);

        inner = this.worldToCanvasNum(inner, playerRelative, scale);
        outer = this.worldToCanvasNum(outer, playerRelative, scale);
        //----------------------------------------//
        
        var gradient = this.cnv.createRadialGradient(start.x, start.y, inner, end.x, end.y, outer);
        return gradient;
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //fill(style)
    //sets the fillStyle of the canvas
    fill(style) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.fill called on a page with no canvas. This might break things.");
            return;
        }
        if (style instanceof Colour) {
            this.cnv.fillStyle = style.txt();
        } else {
            this.cnv.fillStyle = style;
        }
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //stroke(style, width)
    //sets the stroke style of the canvas
    //sets the stroke width of the canvas
    //playerRelative: is the point relative to the player (zoom or position, when applicable)
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    stroke(style, width, playerRelative, scaleWithScreen) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.stroke called on a page with no canvas. This might break things.");
            return;
        }

        //----------------------------------------//
        //Transform the variables into canvas space, if applicable
        width = this.worldToCanvasNum(width, playerRelative, scaleWithScreen);
        //----------------------------------------//

        if (style instanceof Colour) {
            this.cnv.strokeStyle = style.txt();
        } else {
            this.cnv.strokeStyle = style;
        }
        this.cnv.lineWidth = width;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //lineDash(dash)
    //dash: array of length - seperation pairs
    //playerRelative: is the point relative to the player (zoom or position, when applicable)
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    lineDash(dash, playerRelative, scaleWithScreen) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.lineDash called on a page with no canvas. This might break things.");
            return;
        }

        //----------------------------------------//
        //Transform the variables into canvas space, if applicable
        for (var i = 0; i < dash.length; i++) {
            dash[i] = this.worldToCanvasNum(dash[i], playerRelative, scaleWithScreen);
        }
        //----------------------------------------//

        this.cnv.setLineDash(dash);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //beginPath()
    //runs cnv.beginPath()
    beginPath() {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.beginPath called on a page with no canvas. This might break things.");
            return;
        }

        this.cnv.beginPath();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //closePath()
    //runs cnv.closePath()
    closePath() {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.beginPath called on a page with no canvas. This might break things.");
            return;
        }
        this.cnv.closePath();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //arc(pos, rad, startAng, ang)
    //runs cnv.arc
    //playerRelative: is the point relative to the player
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    arc(pos, rad, startAng, ang, playerRelative, scaleWithScreen) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.arc called on a page with no canvas. This might break things.");
            return;
        }
        
        //----------------------------------------//
        //Transform the variables into canvas space, if applicable
        pos = this.worldToCanvas(pos, playerRelative, scaleWithScreen);
        rad = this.worldToCanvasNum(rad, playerRelative, scaleWithScreen);
        if (playerRelative) {
            startAng -= Player.smoothDir;
            ang -= Player.smoothDir;
        }
        //----------------------------------------//
        
        this.cnv.arc(pos.x, pos.y, rad, startAng, ang);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //fillShape()
    //fills the drawn shape / path
    fillShape() {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.fillShape called on a page with no canvas. This might break things.");
            return;
        }

        this.cnv.fill();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //strokeShape()
    //strokes the drawn shape / path
    strokeShape() {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.strokeShape called on a page with no canvas. This might break things.");
            return;
        }

        this.cnv.stroke();
    }
    //----------------------------------------------------------------------//
    

    //----------------------------------------------------------------------//
    //cb_windowResized()
    //resizes the canvas to match the screen size
    cb_windowResized() {
        //----------------------------------------//
        //Calculate the new canvas dimensions
        this.cnvWidth = window.innerWidth;
        this.cnvHeight = window.innerHeight; 
        this.cnvHalfDimen = new Vec2(this.cnvWidth / 2, this.cnvHeight / 2);
        //----------------------------------------//

        //----------------------------------------//
        //Resize the canvas
        if (this.cnv == null) this.cnv = this.canvas.getContext("2d");
        this.canvas.width = this.cnvWidth;
        this.canvas.height = this.cnvHeight;
        //----------------------------------------//

        console.log("Window resized");

    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //drawPolygon(vertices)
    //draws a polygon using an array of vertices
    //playerRelative: is the point relative to the player
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    drawPolygon(vertices, playerRelative, scaleWithScreen) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.drawPolygon called on a page with no canvas. This might break things.");
            return;
        }

        this.beginPath();
        var v0 = this.worldToCanvas(vertices[0], playerRelative, scaleWithScreen);
        this.cnv.moveTo(v0.x, v0.y);

        //Starts at i = 1 because vertices[0] has just been handled
        for (var i = 1; i < vertices.length; i++) {
            var v = this.worldToCanvas(vertices[i], playerRelative, scaleWithScreen);
            this.cnv.lineTo(v.x, v.y);
        }

        this.closePath();

    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //rect(tl, br)
    //creates a rectangle with the top left corner at tl
    //and the bottom right corner at br
    //playerRelative: is the point relative to the player
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    rect(tl, br, playerRelative, scaleWithScreen) {
        //----------------------------------------//
        //IMPORTANT
        //DONT transform the variables into canvas space, as Renderer.drawPolygon() does this for us
        //Also checking if the canvas is null is reduntant for the same reason, Renderer.drawPolygon() checks it too
        //----------------------------------------//


        var vertices = [tl, new Vec2(br.x, tl.y), br, new Vec2(tl.x, br.y)];
        this.drawPolygon(vertices, playerRelative, scaleWithScreen);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //line(a, b, playerRelative, scaleWithScreen)
    //draws a line from a - b
    //playerRelative: is the point relative to the player
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    line(a, b, playerRelative, scaleWithScreen) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.line called on a page with no canvas. This might break things.");
            return;
        }

        //----------------------------------------//
        //Transform the variables into canvas space, if applicable
        a = this.worldToCanvas(a, playerRelative, scaleWithScreen);
        b = this.worldToCanvas(b, playerRelative, scaleWithScreen);
        //----------------------------------------//
        
        this.cnv.moveTo(a.x, a.y);
        this.cnv.lineTo(b.x, b.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //text(text, pos, playerRelative, scaleWithScreen)
    text(text, horizontalAlign, verticalAlign, size, font, pos, playerRelative, scaleWithScreen) {
        //Safety check
        if (!this.hasCnv) {
            console.warn("Renderer.text called on a page with no canvas. This might break things.");
            return;
        }

        size = this.worldToCanvasNum(size, playerRelative, scaleWithScreen);
        pos = this.worldToCanvas(pos, playerRelative, scaleWithScreen);

        text += "\n"; //Add a new line to the end, seems to fix bugs with the text not including the last line???
        const TEXT_ARRAY = text.split("\n"); //Split text up into different lines
        const NUM_LINES = TEXT_ARRAY.length;
        const LINE_SPACING = size;
        this.cnv.font = size + "px " + font;
        this.cnv.textAlign = horizontalAlign;

        var start = 0;
        var end = NUM_LINES * LINE_SPACING;

        if (verticalAlign.includes('middle')) {start = -(NUM_LINES - 1) * LINE_SPACING / 2; end = (NUM_LINES - 1) * LINE_SPACING / 2;}
        if (verticalAlign.includes('top')) {start = -(NUM_LINES - 1) * LINE_SPACING; end = 0;}
        if (verticalAlign.includes('bottom')) {start = 0; end = (NUM_LINES - 1) * LINE_SPACING}
        for (var y = start; y <= end; y += LINE_SPACING) {
            this.cnv.fillText(
                TEXT_ARRAY[Math.round((y - start) / LINE_SPACING)], 
                pos.x, 
                pos.y + y + LINE_SPACING / 1.25 //idk why 1.25, but it works
            ); 
            
        }   


    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Helper functions                                                      //
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //worldToCanvas(pos, playerRelative, scale)
    //converts a world position to a canvas (screen) position
    //playerRelative: is the point relative to the player
    //scaleWithScreen: should the function manage alignment and screen size scaling?
    worldToCanvas(pos, playerRelative, scaleWithScreen) {
        //----------------------------------------//
        //Transform based on player position and zoom
        if (playerRelative) {
            pos = pos.sub(Player.pos);
            pos = pos.mul(new Vec2(Player.smoothZoom, Player.smoothZoom));
            pos = pos.rotate(-Player.smoothDir + Math.PI / 2);
        }
        //----------------------------------------//
        //console.log("Pos before:");
        //console.dir(pos);

        pos = pos.mul(new Vec2(1, -1)); //Canvas y is inverted
        //console.log("Pos mid:");
        //console.dir(pos);

        //----------------------------------------//
        //Transform based on screen dimensions
        if (scaleWithScreen) {
            pos = pos.div(new Vec2(this.scaleCnvSize, this.scaleCnvSize));
            pos = pos.mul(new Vec2(this.cnvHeight, this.cnvHeight));
            pos = pos.add(this.cnvHalfDimen);
        }
        //----------------------------------------//
        //console.log("Pos final:");
        //console.dir(pos);
        
        return pos;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //worldToCanvasNum(num, playerRelative, scale)
    //Transforms the number from world space to canvas space
    //playerRelative: is the number relative to the player zoom
    //scaleWithScreen: should the function manage screen size scaling?
    worldToCanvasNum(num, playerRelative, scaleWithScreen) {
        //----------------------------------------//
        //Transform based on zoom
        if (playerRelative) {
            num *= Player.smoothZoom;
        }
        //----------------------------------------//


        //----------------------------------------//
        //Transform based on screen size
        if (scaleWithScreen) {
            num /= this.scaleCnvSize;
            num *= this.cnvHeight;
        }
        //----------------------------------------//
        
        return num;
    }
    //----------------------------------------------------------------------//
    
}
