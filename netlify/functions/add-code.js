// netlify/functions/add-code.js (Using require and manual config)
console.log("--- add-code.js: File start (using require) ---");

// Use require
const { getStore } = require("@netlify/blobs");

console.log("--- add-code.js: Require successful ---");

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";
// Get ADD_CODE_SECRET from environment variables set in Netlify UI
const EXPECTED_SECRET = process.env.ADD_CODE_SECRET;

// Use module.exports.handler
module.exports.handler = async (req, context) => {
    console.log("--- add-code.js: Function handler invoked ---");

    if (!EXPECTED_SECRET) {
         console.error("ADD_CODE_SECRET environment variable is not set!");
         return {
             statusCode: 500,
             body: JSON.stringify({ success: false, message: "Server configuration error (secret missing)." }),
             headers: { "Content-Type": "application/json" },
         };
    }

    if (req.method !== "POST") {
        console.log("--- add-code.js: Incorrect method (not POST) ---");
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
            headers: { "Content-Type": "application/json", Allow: "POST" },
        };
    }

    let requestBody;
    try {
       // Assume body might be string or object depending on Netlify runner
       if (typeof req.body === 'string') {
           requestBody = JSON.parse(req.body);
       } else {
           requestBody = req.body;
       }
       if (!requestBody) throw new Error("Request body is missing or empty.");

    } catch (error) {
       console.error("--- add-code.js: Invalid JSON body ---", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON body" }),
            headers: { "Content-Type": "application/json" },
        };
    }

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
    // --- ---

    if (!newCode || typeof newCode !== 'string' || !/^\d{8}$/.test(newCode)) {
        console.log("--- add-code.js: Invalid code format ---", newCode);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid or missing 8-digit code format." }),
            headers: { "Content-Type": "application/json" },
        };
    }

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
         console.log("--- add-code.js: Environment variables found ---");

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
              console.log("--- add-code.js: Parsed existing codes ---", currentCodes.length);
            } catch(parseError) {
              console.error("--- add-code.js: Failed to parse codes from blob store ---", parseError);
              currentCodes = [];
            }
        } else {
            console.log("--- add-code.js: No existing codes found in store ---");
        }

        const codeSet = new Set(currentCodes);
        if (!codeSet.has(newCode)) {
            currentCodes.push(newCode);
            await store.setJSON(CODES_KEY, currentCodes);
            console.log(`--- add-code.js: Code ${newCode} added. ---`);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: `Code ${newCode} added.` }),
                headers: { "Content-Type": "application/json" },
            };
        } else {
             console.log(`--- add-code.js: Code ${newCode} already exists. ---`);
             return {
                 statusCode: 409, // Conflict
                 body: JSON.stringify({ success: false, message: `Code ${newCode} already exists.` }),
                 headers: { "Content-Type": "application/json" },
             };
        }

    } catch (error) {
        console.error("--- add-code.js: Caught error in try block ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message || "Server error while adding code." }),
            headers: { "Content-Type": "application/json" },
        };
    }
};

// Removed export const config

console.log("--- add-code.js: File end (using require) ---");