//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//review_manager.mjs                                                    //
//handles review saving, loading                                        //
//----------------------------------------------------------------------//
import { FB_User } from "./firebase/fb_data.mjs";
import { FB_IO } from "./firebase/fb_io.mjs";
import { Security } from "./security.mjs";

//----------------------------------------------------------------------//
//Review class - stores a single review and its metadata
export class Review {
    constructor(REVIEW_TXT, USERNAME, PHOTO_URL) {
        this.txt = REVIEW_TXT;
        this.username = USERNAME;
        this.url = PHOTO_URL;
    }
}
//END OF Review
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//ReviewManager class - handles saving a loading reviews
export class ReviewManager {
    static MAX_REVIEW_LENGTH = 1000;
    //----------------------------------------------------------------------//
    //readReviews()
    static async readReviews() {
        const LIST = await FB_IO.read('gameSite/reviews/');
        const KEYS = Object.keys(LIST);

        var reviews = [];
        for (var i = 0; i < KEYS.length; i++) {
            const OBJ = LIST[KEYS[i]];
            const REVIEW = OBJ.review;
            const USERNAME = OBJ.username;
            const PHOTO_URL = OBJ.photoURL;
            
            reviews.push(new Review(REVIEW, USERNAME, PHOTO_URL));
        }

        return reviews;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //submitReview(review)
    //returns a result string:
    //length - review is too long
    //malicious - review may be malicious
    //success - review write succeeded
    static submitReview(review) {
        const IS_TOO_LONG = (review.length > ReviewManager.MAX_REVIEW_LENGTH);
        if (IS_TOO_LONG) {
            return "length";
        }
        if (Security.detectMaliciousText(review)) {
            //Review is insecure
            console.warn("Attempted to submit a malicious review!");
            return "malicious"; 
        }
        FB_IO.write('gameSite/reviews/' + FB_User.uid + "/review", '', review);
        FB_IO.write('gameSite/reviews/' + FB_User.uid + "/username", '', FB_User.username);
        FB_IO.write('gameSite/reviews/' + FB_User.uid + "/photoURL", '', FB_User.photoURL);
        return "success";
    }
    //----------------------------------------------------------------------//
    
}
//END OF ReviewManager
//----------------------------------------------------------------------//


