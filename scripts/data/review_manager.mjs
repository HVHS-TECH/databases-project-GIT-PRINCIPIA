//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//review_manager.mjs                                                    //
//handles review saving, loading                                        //
//----------------------------------------------------------------------//
import { FB_User } from "./firebase/fb_data.mjs";
import { FB_IO } from "./firebase/fb_io.mjs";

//----------------------------------------------------------------------//
//Review class - stores a single review and its metadata
export class Review {
    constructor(REVIEW_TXT, USERNAME, PHOTO_URL) {
        this.txt = REVIEW_TXT;
        this.username = username;
        this.url = photoURL;
    }
}
//END OF Review
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//ReviewManager class - handles saving a loading reviews
export class ReviewManager {
    //----------------------------------------------------------------------//
    //readReviews()
    static async readReviews() {
        const LIST = FB_IO.read('game-site/reviews/');
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
    static submitReview(review) {
        const MAX_REVIEW_LENGTH = 1000;
        review = review.slice(0, MAX_REVIEW_LENGTH);
        if (!handleSecurity(review)) {
            //Review is insecure
            console.warn("Attempted to submit a malicious review!");
            return; 
        }
        FB_IO.write('game-site/reviews/' + FB_User.uid + "/review", '', review);
        FB_IO.write('game-site/reviews/' + FB_User.uid + "/username", '', FB_User.username);
        FB_IO.write('game-site/reviews/' + FB_User.uid + "/photoURL", '', FB_User.photoURL);
    }
    //----------------------------------------------------------------------//
    
}
//END OF ReviewManager
//----------------------------------------------------------------------//


//From my Sals Strawberries mini task
function handleSecurity(txt) {
    if (typeof txt != 'string') return true;
    const LOWERCASE = txt.toLocaleLowerCase();
    const MIGHT_HAVE_TAG = LOWERCASE.indexOf('<') != -1 && LOWERCASE.indexOf('>') != -1;

    //run when loaded
    const MIGHT_HAVE_ONERROR = LOWERCASE.indexOf('onerror') != -1;
    const MIGHT_HAVE_ONLOAD = LOWERCASE.indexOf('onload') != -1;

    //e.g buttons
    const MIGHT_HAVE_ONCLICK = LOWERCASE.indexOf('onclick') != -1;

    //inputs
    const MIGHT_HAVE_ONCHANGE = LOWERCASE.indexOf('onchange') != -1;
    const MIGHT_HAVE_ONINPUT = LOWERCASE.indexOf('oninput') != -1;
    const MIGHT_HAVE_ONSUBMIT = LOWERCASE.indexOf('onsubmit') != -1;

    //script
    const MIGHT_HAVE_SCRIPT = LOWERCASE.indexOf('script') != -1;


    const MIGHT_HAVE_MALICIOUS_TAG_TEXT = 
    MIGHT_HAVE_ONERROR || 
    MIGHT_HAVE_ONLOAD || 
    MIGHT_HAVE_ONCLICK || 
    MIGHT_HAVE_ONCHANGE || 
    MIGHT_HAVE_ONINPUT || 
    MIGHT_HAVE_ONSUBMIT || 
    MIGHT_HAVE_SCRIPT;

    const MIGHT_HAVE_MALICIOUS_TAG = MIGHT_HAVE_MALICIOUS_TAG_TEXT && MIGHT_HAVE_TAG;

    if (MIGHT_HAVE_MALICIOUS_TAG) {
        return false;
    }
    return true;
}