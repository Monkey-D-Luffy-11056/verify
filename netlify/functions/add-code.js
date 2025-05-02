// netlify/functions/add-code.js (Corrected handler signature, using require and manual config)
console.log("--- add-code.js: File start (using require) ---");

// Use require
const { getStore } = require("@netlify/blobs");

console.log("--- add-code.js: Require successful ---");

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";
// Get ADD_CODE_SECRET from environment variables set in Netlify UI
const EXPECTED_SECRET = process.env.ADD_CODE_SECRET;

// Use module.exports.handler with event, context
module.exports.handler = async (event, context) => {
    console.log("--- add-code.js: Function handler invoked ---");

    // Check if the required ADD_CODE_SECRET is configured
    if (!EXPECTED_SECRET) {
         console.error("ADD_CODE_SECRET environment variable is not set!");
         return {
             statusCode: 500,
             body: JSON.stringify({ success: false, message: "Server configuration error (secret missing)." }),
             headers: { "Content-Type": "application/json" },
         };
    }

    // Check HTTP Method using event.httpMethod
    console.log("--- add-code.js: Received event.httpMethod:", event.httpMethod);
    if (event.httpMethod !== "POST") {
        console.log("--- add-code.js: Incorrect method detected (not POST) ---");
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
            headers: { "Content-Type": "application/json", Allow: "POST" },
        };
    }
    console.log("--- add-code.js: Method check passed (POST detected) ---");

    // Parse request body from event.body
    let requestBody;
    try {
       // Body is often a string in this signature, needs parsing
       if (typeof event.body === 'string') {
           console.log("--- add-code.js: event.body is string, attempting JSON.parse ---");
           requestBody = JSON.parse(event.body);
       } else if (typeof event.body === 'object' && event.body !== null) {
           console.log("--- add-code.js: event.body is object, using directly ---");
           requestBody = event.body; // Assume already parsed
       } else {
            throw new Error("Event body is missing, empty, or not a string/object.");
       }
       console.log("--- add-code.js: Request body parsed/accessed ---");

    } catch (error) {
       console.error("--- add-code.js: Invalid JSON body ---", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON body: " + error.message }),
            headers: { "Content-Type": "application/json" },
        };
    }

    // Extract code and secret from parsed body
    const { code: newCode, secret: providedSecret } = requestBody;

    // --- Security Check ---
    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
        console.warn("--- add-code.js: Unauthorized attempt ---");
        return {
            statusCode: 401, // Unauthorized
            body: JSON.stringify({ success: false, message: "Unauthorized." }),
            headers: { "Content-Type": "application/json" },
        };
    }
    console.log("--- add-code.js: Authorization successful ---");
    // --- ---

    // Validate the new code format
    if (!newCode || typeof newCode !== 'string' || !/^\d{8}$/.test(newCode)) {
        console.log("--- add-code.js: Invalid code format ---", newCode);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid or missing 8-digit code format." }),
            headers: { "Content-Type": "application/json" },
        };
    }
     console.log("--- add-code.js: Code format check passed ---");

    // Main logic to add the code
    try {
        console.log("--- add-code.js: Entering try block ---");

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
        console.log("--- add-code.js: Environment variables for blobs found ---");

        // Pass options to getStore
        const store = getStore({ name: STORE_NAME, siteID, token });
        console.log("--- add-code.js: getStore initialized ---");
        // --- END Manual config ---

        const currentCodesJSON = await store.get(CODES_KEY);
        console.log("--- add-code.js: store.get executed ---");
        let currentCodes = [];
        if (currentCodesJSON) {
            try {
              currentCodes = JSON.parse(currentCodesJSON);
              if (!Array.isArray(currentCodes)) currentCodes = [];
              console.log("--- add-code.js: Parsed existing codes, count:", currentCodes.length);
            } catch(parseError) {
              console.error("--- add-code.js: Failed to parse codes from blob store ---", parseError);
              currentCodes = []; // Reset if parsing fails
            }
        } else {
            console.log("--- add-code.js: No existing codes found in store ---");
        }

        // Check if code already exists using a Set for efficiency
        const codeSet = new Set(currentCodes);
        if (!codeSet.has(newCode)) {
            currentCodes.push(newCode); // Add the new code
            await store.setJSON(CODES_KEY, currentCodes); // Save the updated list
            console.log(`--- add-code.js: Code ${newCode} added. ---`);

            return { // Return success
                statusCode: 200,
                body: JSON.stringify({ success: true, message: `Code ${newCode} added.` }),
                headers: { "Content-Type": "application/json" },
            };
        } else {
             console.log(`--- add-code.js: Code ${newCode} already exists. ---`);
             return { // Return conflict error
                 statusCode: 409, // Conflict
                 body: JSON.stringify({ success: false, message: `Code ${newCode} already exists.` }),
                 headers: { "Content-Type": "application/json" },
             };
        }

    } catch (error) {
        console.error("--- add-code.js: Caught error in try block ---", error);
        return { // Return generic server error
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message || "Server error while adding code." }),
            headers: { "Content-Type": "application/json" },
        };
    }
}; // End of module.exports.handler

console.log("--- add-code.js: File end (using require) ---");