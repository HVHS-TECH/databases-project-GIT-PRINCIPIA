//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//review_write_dispatch.mjs                                             //
//handles posting reviews, interface, etc                               //
//----------------------------------------------------------------------//

import { Exposure } from "../utility/exposure.mjs";
import { ReviewManager } from "./review_manager.mjs";

//----------------------------------------------------------------------//
//ReviewWriteDispatch class - handles review posting interface
export class ReviewWriteDispatch {
    static htmlReviewInput = null;
    static htmlCharacterCountOutput = null;
    static htmlReviewSubmitResult = null;
    //----------------------------------------------------------------------//
    //init()
    static init() {
        console.log("Initializing ReviewWriteDispatch");
        ReviewWriteDispatch.htmlReviewInput = document.getElementById('i-review');
        ReviewWriteDispatch.htmlCharacterCountOutput = document.getElementById('o-review-character-count');
        ReviewWriteDispatch.htmlReviewSubmitResult = document.getElementById('o-review-submit-result');

        ReviewWriteDispatch.htmlReviewInput.oninput = ReviewWriteDispatch.onEditReview;

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
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<i>Successfully submitted review!</i>";
                //Remove the message after a while
                setTimeout(()=>{ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "";}, 5000);
                break;
            case 'length':
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<i>Review is too long! Please shorten it to be at or below " + ReviewManager.MAX_REVIEW_LENGTH + " characters.</i>";
                break;
            case 'malicious':
                ReviewWriteDispatch.htmlReviewSubmitResult.innerHTML = "<i>Potentially malicious text detected! Please remove any HTML tags such as 'onerror' or 'onload'.</i>";
                break;
            default:
                break;
        }
    }
    //----------------------------------------------------------------------//
}
//END OF ReviewWriteDispatch
//----------------------------------------------------------------------//

window.onLogin = ()=>{
    ReviewWriteDispatch.init();
    Exposure.expose(ReviewWriteDispatch.submit, 'submitReview'); //Expose submit function to the window
}
