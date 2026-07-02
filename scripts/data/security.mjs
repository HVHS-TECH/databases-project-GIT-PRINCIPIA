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
    static detectMaliciousText(txt, allowOnclick = false) {
        if (typeof txt != 'string') return false;
        const LOWERCASE = txt.toLocaleLowerCase();
        const INDEXOF_LESSTHAN = LOWERCASE.indexOf('<');
        const INDEXOF_MORETHAN = LOWERCASE.indexOf('>');

        const MIGHT_HAVE_TAG = (INDEXOF_LESSTHAN != -1);

        //run when loaded
        const MIGHT_HAVE_ONERROR = LOWERCASE.indexOf('onerror') != -1 && (LOWERCASE.indexOf('onerror') > INDEXOF_LESSTHAN);
        const MIGHT_HAVE_ONLOAD = LOWERCASE.indexOf('onload') != -1 && (LOWERCASE.indexOf('onload') > INDEXOF_LESSTHAN);

        //e.g buttons
        const MIGHT_HAVE_ONCLICK = LOWERCASE.indexOf('onclick') != -1 && (LOWERCASE.indexOf('onclick') > INDEXOF_LESSTHAN);

        //inputs
        const MIGHT_HAVE_ONCHANGE = LOWERCASE.indexOf('onchange') != -1 && (LOWERCASE.indexOf('onchange') > INDEXOF_LESSTHAN);
        const MIGHT_HAVE_ONINPUT = LOWERCASE.indexOf('oninput') != -1 && (LOWERCASE.indexOf('oninput') > INDEXOF_LESSTHAN);
        const MIGHT_HAVE_ONSUBMIT = LOWERCASE.indexOf('onsubmit') != -1 && (LOWERCASE.indexOf('onsubmit') > INDEXOF_LESSTHAN);

        //script
        const MIGHT_HAVE_SCRIPT = LOWERCASE.indexOf('script') != -1;


        const MIGHT_HAVE_MALICIOUS_TAG_TEXT = 
        MIGHT_HAVE_ONERROR || 
        MIGHT_HAVE_ONLOAD || 
        (allowOnclick ? false : MIGHT_HAVE_ONCLICK) || 
        MIGHT_HAVE_ONCHANGE || 
        MIGHT_HAVE_ONINPUT || 
        MIGHT_HAVE_ONSUBMIT || 
        MIGHT_HAVE_SCRIPT;

        const MIGHT_HAVE_MALICIOUS_TAG = MIGHT_HAVE_MALICIOUS_TAG_TEXT && (MIGHT_HAVE_TAG);

        if (MIGHT_HAVE_MALICIOUS_TAG) {
            return true;
        }
        return false;
    }
    //----------------------------------------------------------------------//
}
//END OF Security
//----------------------------------------------------------------------//
