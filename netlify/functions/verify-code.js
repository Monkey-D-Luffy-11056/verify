// netlify/functions/verify-code.js (Corrected handler signature)
console.log("--- verify-code.js: File start (using require) ---");

const { getStore } = require("@netlify/blobs");

console.log("--- verify-code.js: Require successful ---");

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";

// Use correct signature: event, context
module.exports.handler = async (event, context) => {
    console.log("--- verify-code.js: Function handler invoked ---");

    // --- Use event.httpMethod ---
    console.log("--- verify-code.js: Received event.httpMethod:", event.httpMethod);

    if (event.httpMethod !== "POST") { // Check event.httpMethod
        console.log("--- verify-code.js: Incorrect method detected (not POST) ---");
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
            headers: { "Content-Type": "application/json", Allow: "POST" },
        };
    }

    console.log("--- verify-code.js: Method check passed (POST detected) ---");

    let requestBody;
    try {
        // --- Use event.body ---
        // Body is often a string in this signature, needs parsing
        if (typeof event.body === 'string') {
             console.log("--- verify-code.js: event.body is string, attempting JSON.parse ---");
             requestBody = JSON.parse(event.body);
        } else if (typeof event.body === 'object' && event.body !== null) {
             // Sometimes it might be pre-parsed? Handle this case too.
             console.log("--- verify-code.js: event.body is object, using directly ---");
             requestBody = event.body;
        } else {
             throw new Error("Event body is missing, empty, or not a string/object.");
        }
        console.log("--- verify-code.js: Request body parsed/accessed ---");

    } catch (error) {
        console.error("--- verify-code.js: Invalid JSON body ---", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON body: " + error.message }),
            headers: { "Content-Type": "application/json" },
        };
    }

    const { code: submittedCode } = requestBody;

    if (!submittedCode || typeof submittedCode !== 'string' || submittedCode.length !== 8) {
        console.log("--- verify-code.js: Invalid code format ---", submittedCode);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid or missing 8-digit code." }),
            headers: { "Content-Type": "application/json" },
        };
    }
    console.log("--- verify-code.js: Code format check passed ---");

    try {
        console.log("--- verify-code.js: Entering try block ---");

        const siteID = process.env.MANUAL_SITE_ID;
        const token = process.env.MANUAL_BLOB_TOKEN;

        if (!siteID || !token) {
          console.error("Missing MANUAL_SITE_ID or MANUAL_BLOB_TOKEN environment variables!");
          return {
              statusCode: 500,
              body: JSON.stringify({ success: false, message: "Server configuration error for storage." }),
              headers: { "Content-Type": "application/json" },
          };
        }
        console.log("--- verify-code.js: Environment variables for blobs found ---");

        const store = getStore({ name: STORE_NAME, siteID, token });
        console.log("--- verify-code.js: getStore initialized ---");

        const currentCodesJSON = await store.get(CODES_KEY);
        console.log("--- verify-code.js: store.get executed ---");
        let currentCodes = [];
        if (currentCodesJSON) {
            try {
              currentCodes = JSON.parse(currentCodesJSON);
              if (!Array.isArray(currentCodes)) currentCodes = [];
              console.log("--- verify-code.js: Parsed existing codes, count:", currentCodes.length);
            } catch (parseError){
              console.error("--- verify-code.js: Failed to parse codes from blob store ---", parseError);
              currentCodes = [];
            }
        } else {
             console.log("--- verify-code.js: No existing codes found in store ---");
        }

        const codeIndex = currentCodes.indexOf(submittedCode);
        console.log(`--- verify-code.js: Checking code ${submittedCode}, index: ${codeIndex} ---`);

        if (codeIndex > -1) {
            currentCodes.splice(codeIndex, 1);
            await store.setJSON(CODES_KEY, currentCodes);
            console.log(`--- verify-code.js: Code ${submittedCode} verified and removed. ---`);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: "Verification Successful!" }),
                headers: { "Content-Type": "application/json" },
            };
        } else {
            console.log(`--- verify-code.js: Code ${submittedCode} not found or already used. ---`);
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: "Invalid or expired verification code." }),
                headers: { "Content-Type": "application/json" },
            };
        }
    } catch (error) {
        console.error("--- verify-code.js: Caught error in try block ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message || "Server error during verification." }),
            headers: { "Content-Type": "application/json" },
        };
    }
}; // End of module.exports.handler

console.log("--- verify-code.js: File end (using require) ---");