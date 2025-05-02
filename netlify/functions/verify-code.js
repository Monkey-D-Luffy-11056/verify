// netlify/functions/verify-code.js (With Debug Logging)
console.log("--- verify-code.js: File start ---"); // Log 1

import { getStore } from "@netlify/blobs"; // The potentially problematic import

console.log("--- verify-code.js: Import successful ---"); // Log 2

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";

export default async (req, context) => {
    console.log("--- verify-code.js: Function handler invoked ---"); // Log 3

    // ... (rest of the original function code remains the same) ...
    if (req.method !== "POST") {
        // ...
    }
    // ... etc ...
    try {
        console.log("--- verify-code.js: Entering try block ---"); // Log 4
        const store = getStore(STORE_NAME);
        // ...
    } catch (error) {
        console.error("--- verify-code.js: Caught error ---", error); // Log 5
        // ...
    }
    // ... (rest of the original function code remains the same) ...
};

export const config = {
    path: "/.netlify/functions/verify-code",
};

console.log("--- verify-code.js: File end ---"); // Log 6