//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//review_display.mjs                                                    //
//handles displaying reviews                                            //
//----------------------------------------------------------------------//

import { Review, ReviewManager } from "./review_manager.mjs";
import { Security } from "./security.mjs";
import { FB_IO } from "./firebase/fb_io.mjs";
import { FB_Init } from "./firebase/fb_init.mjs";
import { HighScoreDisplay } from "./high_score_display.mjs";
//----------------------------------------------------------------------//
//ReviewDisplay class - handles displaying reviews
export class ReviewDisplay {
    //----------------------------------------------------------------------//
    //displayReviews(target)
    //target: the html element to display the review in
    static async displayReviews(target) {
        console.log("ReviewDisplay::displayReviews(target): loading reviews!");
        target.innerHTML = "<p><i><b>Loading reviews list...</b></i></p>"; //Display loading message

        const REVIEWS_READ = await ReviewManager.readReviews();
        console.log("ReviewDisplay::displayReviews(target): read reviews!");
        console.dir(REVIEWS_READ);

        target.innerHTML = ""; //Remove any previously loaded reviews

        for (var r = 0; r < REVIEWS_READ.length; r++) {
            const REVIEW = REVIEWS_READ[r];

            var html = ReviewDisplay.constructSingleReviewHTML(REVIEW);
            target.innerHTML += html;

            target.innerHTML += "<div class='review-br'></div>";
        }
        //Update high score tables in review
        HighScoreDisplay.bindToHTML();

        //Init accordions
        var accs = document.getElementsByClassName('accordion');
        for (var i = 0; i < accs.length; i++) {
            accs[i].addEventListener('click', 
                function(){
                    
                    var panel = this.nextElementSibling;
                    if (panel.style.display == "flex" || panel.style.display == "block") {
                        panel.style.display = "none";
                        this.innerHTML = "- SHOW -";
                    } else {
                        panel.style.display = (this.classList.contains('#block')) ? "block" : "flex";
                        this.innerHTML = "- HIDE -";
                    }
                }
            );
        }

        console.log("ReviewDisplay::displayReviews(target): reviews loaded!");
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //constructSingleReviewHTML(reviewObj)
    static constructSingleReviewHTML(reviewObj) {
        if (!(reviewObj instanceof Review)) {
            console.error("ReviewDisplay::constructSingleReview(reviewObj): reviewObj is not a review!");
            console.log("reviewObj: ");
            console.dir(reviewObj);
            return "";
        }
        if (Security.detectMaliciousText(reviewObj.txt)) {
            console.warn("Malicious text detected in review: ");
            console.dir(reviewObj.txt);
            return "";
        }
        if (Security.detectMaliciousText(reviewObj.url)) {
            console.warn("Malicious text detected in url: ");
            console.dir(reviewObj.url);
            return "";
        }
        if (Security.detectMaliciousText(reviewObj.username)) {
            console.warn("Malicious text detected in username: ");
            console.dir(reviewObj.username);
            return "";
        }

        //----------------------------------------//
        //We now know the review is safe!
        //----------------------------------------//

        var html = "<div class='review center column'>";

        //----------------------------------------//
        //Header div
        html += "<div class='row'>"
        html += '<img class="profile-picture" src="' + reviewObj.url + '" alt="profile picture" referrerpolicy="no-referrer">';
        html += "<p class='review-username'><b>" + reviewObj.username + "</b></p>";
        html += "</div>";
        //----------------------------------------//

        //----------------------------------------//
        //Review
        html += "<button class='review-accordion accordion'>- SEE REVIEW -</button><div class='column center span-width' style='display: none;'><p class='review-paragraph'>";
        html += reviewObj.txt
        html += "</p></div>";
        //----------------------------------------//

        //----------------------------------------//
        //End
        html += "</div>";
        //----------------------------------------//

        return html;
    }
    //----------------------------------------------------------------------//
}
//END OF ReviewDisplay
//----------------------------------------------------------------------//

window.fb_onlogin.subscribe(()=>{
    const TARGET = document.getElementById('reviews-list-target');
    FB_IO.addWriteListener('gameSite/reviews/', ()=>{ReviewDisplay.displayReviews(TARGET);});
});
