//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//review_write_dispatch.mjs                                             //
//handles posting reviews, interface, etc                               //
//----------------------------------------------------------------------//

import { Exposure } from "../utility/exposure.mjs";
import { HighScoreDisplay } from "./high_score_display.mjs";
import { HighScoreManager } from "./high_score_manager.mjs";
import { ReviewManager } from "./review_manager.mjs";
import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_User } from "./firebase/fb_data.mjs";
//----------------------------------------------------------------------//
//ReviewWriteDispatch class - handles review posting interface
export class ReviewWriteDispatch {
    static htmlReviewInput = null;
    static htmlCharacterCountOutput = null;
    static htmlReviewSubmitResult = null;
    //----------------------------------------------------------------------//
    //init()
    static async init() {
        console.log("Initializing ReviewWriteDispatch");
        ReviewWriteDispatch.htmlReviewInput = document.getElementById('i-review');
        ReviewWriteDispatch.htmlCharacterCountOutput = document.getElementById('o-review-character-count');
        ReviewWriteDispatch.htmlReviewSubmitResult = document.getElementById('o-review-submit-result');

        ReviewWriteDispatch.htmlReviewInput.oninput = ReviewWriteDispatch.onEditReview;
        const REV = await FB_IO.read('gameSite/reviews/' + FB_User.uid);
        if (REV != null) {
            ReviewWriteDispatch.htmlReviewInput.value = REV.review;
        }

    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //onEditReview()
    //callback
    static onEditReview() {
        const CURR_TEXT = ReviewWriteDispatch.htmlReviewInput.value;
        ReviewWriteDispatch.htmlCharacterCountOutput.innerHTML = "<i>" + CURR_TEXT.length + " / " + ReviewManager.MAX_REVIEW_LENGTH + " characters</i>";
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //submit()
    //submit the review
    static submit() {
        const TXT = ReviewWriteDispatch.htmlReviewInput.value;
        const RESULT = ReviewManager.submitReview(TXT);

        switch (RESULT) {
            case 'success':
                //Review submit succeeded
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<b><i>Successfully submitted review!</i></b>";
                
                //Remove the message after a while
                setTimeout(()=>{ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "";}, 5000);
                break;
            case 'length':
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<b><i>Review is too long! Please shorten it to be at or below " + ReviewManager.MAX_REVIEW_LENGTH + " characters.</i></b>";
                break;
            case 'empty': 
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<b><i>Review is empty! Please submit a review.</i></b>";
                break;
            case 'malicious':
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<b><i>Potentially malicious text detected! Please remove any HTML tags such as 'onerror' or 'onload'.</i></b>";
                break;
            default:
                break;
        }
    }
    //----------------------------------------------------------------------//
}
//END OF ReviewWriteDispatch
//----------------------------------------------------------------------//

window.fb_onlogin.subscribe(()=>{
    ReviewWriteDispatch.init();
    Exposure.expose(ReviewWriteDispatch.submit, 'submitReview'); //Expose submit function to the window
});
