//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//high_score_meta_data.mjs                                              //
//handles telling high_score_display.mjs what game to display scores for//
//----------------------------------------------------------------------//
import {HighScoreDisplay} from '../../data/high_score_display.mjs';

addEventListener('load', ()=>{HighScoreDisplay.displayHighScores("astro-explorer");});