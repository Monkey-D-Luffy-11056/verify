// netlify/functions/verify-code.js (Using require)
console.log("--- verify-code.js: File start (using require) ---"); // Log 1

// Use require instead of import
const { getStore } = require("@netlify/blobs");

console.log("--- verify-code.js: Require successful ---"); // Log 2

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";

// Change export default to module.exports
module.exports.handler = async (req, context) => { // Note: Use module.exports.handler for Netlify with require
    console.log("--- verify-code.js: Function handler invoked ---"); // Log 3

    // ... (rest of the original function logic: if (req.method !== "POST") etc.) ...

    try {
        console.log("--- verify-code.js: Entering try block ---"); // Log 4
        const store = getStore(STORE_NAME);
        // ... (rest of the try block) ...
    } catch (error) {
        console.error("--- verify-code.js: Caught error ---", error); // Log 5
        // ... (rest of the catch block) ...
    }
};

// Remove the named export 'config' when using module.exports.handler
// Netlify uses the file name for the path by default.
// export const config = {
//   path: "/.netlify/functions/verify-code",
// };


console.log("--- verify-code.js: File end (using require) ---"); // Log 6