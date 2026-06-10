//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//security.mjs                                                          //
//handles removing / detecting potentially malicious text                //
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Security class - handles removing / detecting potentially malicious text
export class Security {
    //----------------------------------------------------------------------//
    //detectMaliciousText(txt)
    //returns false if it is safe
    //Adapted from my Sals Strawberries mini task function 'handleSecurity'
    static detectMaliciousText(txt) {
        if (typeof txt != 'string') return false;
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
            return true;
        }
        return false;
    }
    //----------------------------------------------------------------------//
}
//END OF Security
//----------------------------------------------------------------------//
