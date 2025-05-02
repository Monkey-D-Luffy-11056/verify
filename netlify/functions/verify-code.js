// netlify/functions/verify-code.js (Using require and manual config)
console.log("--- verify-code.js: File start (using require) ---");

// Use require instead of import
const { getStore } = require("@netlify/blobs");

console.log("--- verify-code.js: Require successful ---");

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";

// Use module.exports.handler
module.exports.handler = async (req, context) => {
    console.log("--- verify-code.js: Function handler invoked ---");

    if (req.method !== "POST") {
        console.log("--- verify-code.js: Incorrect method (not POST) ---");
        return { // Return standard response object
            statusCode: 405,
            body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
            headers: { "Content-Type": "application/json", Allow: "POST" },
        };
    }

    let requestBody;
    try {
        // Netlify Functions using module.exports provide body directly if Content-Type is correct
        // For safety, check if it needs parsing (might depend on exact Netlify runner)
        if (typeof req.body === 'string') {
             requestBody = JSON.parse(req.body);
        } else {
             requestBody = req.body; // Assume already parsed if not a string
        }
        if (!requestBody) throw new Error("Request body is missing or empty.");

    } catch (error) {
        console.error("--- verify-code.js: Invalid JSON body ---", error);
        return { // Return standard response object
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON body" }),
            headers: { "Content-Type": "application/json" },
        };
    }

    const { code: submittedCode } = requestBody;

    if (!submittedCode || typeof submittedCode !== 'string' || submittedCode.length !== 8) {
        console.log("--- verify-code.js: Invalid code format ---", submittedCode);
        return { // Return standard response object
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid or missing 8-digit code." }),
            headers: { "Content-Type": "application/json" },
        };
    }

    try {
        console.log("--- verify-code.js: Entering try block ---");

        // --- Manually configure getStore ---
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
        console.log("--- verify-code.js: Environment variables found ---");

        // Pass options to getStore
        const store = getStore({ name: STORE_NAME, siteID, token });
        console.log("--- verify-code.js: getStore initialized ---");
        // --- END Manual config ---

        const currentCodesJSON = await store.get(CODES_KEY);
        console.log("--- verify-code.js: store.get executed ---");
        let currentCodes = [];
        if (currentCodesJSON) {
            try {
              currentCodes = JSON.parse(currentCodesJSON);
              if (!Array.isArray(currentCodes)) currentCodes = []; // Handle non-array data
              console.log("--- verify-code.js: Parsed existing codes ---", currentCodes.length);
            } catch (parseError){
              console.error("--- verify-code.js: Failed to parse codes from blob store ---", parseError);
              currentCodes = []; // Reset if parsing fails
            }
        } else {
             console.log("--- verify-code.js: No existing codes found in store ---");
        }

        const codeIndex = currentCodes.indexOf(submittedCode);
        console.log(`--- verify-code.js: Checking code ${submittedCode}, index: ${codeIndex} ---`);

        if (codeIndex > -1) {
            currentCodes.splice(codeIndex, 1); // Remove the code
            await store.setJSON(CODES_KEY, currentCodes); // Save updated list
            console.log(`--- verify-code.js: Code ${submittedCode} verified and removed. ---`);

            return { // Return standard response object
                statusCode: 200,
                body: JSON.stringify({ success: true, message: "Verification Successful!" }),
                headers: { "Content-Type": "application/json" },
            };
        } else {
            console.log(`--- verify-code.js: Code ${submittedCode} not found or already used. ---`);
            return { // Return standard response object
                statusCode: 400, // Bad Request (invalid code)
                body: JSON.stringify({ success: false, message: "Invalid or expired verification code." }),
                headers: { "Content-Type": "application/json" },
            };
        }
    } catch (error) {
        console.error("--- verify-code.js: Caught error in try block ---", error);
        return { // Return standard response object
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ success: false, message: error.message || "Server error during verification." }),
            headers: { "Content-Type": "application/json" },
        };
    }
};

// Removed export const config

console.log("--- verify-code.js: File end (using require) ---");