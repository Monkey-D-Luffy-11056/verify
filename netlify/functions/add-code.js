import { getStore } from "@netlify/blobs";

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";

// Secret MUST be set as Environment Variable in Netlify UI: ADD_CODE_SECRET
const EXPECTED_SECRET = process.env.ADD_CODE_SECRET;

export default async (req, context) => {
    if (!EXPECTED_SECRET) {
         console.error("ADD_CODE_SECRET environment variable is not set!");
         return new Response(JSON.stringify({ success: false, message: "Server configuration error." }), {
             status: 500, headers: { "Content-Type": "application/json" },
         });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed" }), {
            status: 405, headers: { "Content-Type": "application/json", Allow: "POST" },
        });
    }

    let requestBody;
    try {
        requestBody = await req.json();
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: "Invalid JSON body" }), {
            status: 400, headers: { "Content-Type": "application/json" },
        });
    }

    const { code: newCode, secret: providedSecret } = requestBody;

    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
        console.warn("Unauthorized attempt to add code.");
        return new Response(JSON.stringify({ success: false, message: "Unauthorized." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!newCode || typeof newCode !== 'string' || !/^\d{8}$/.test(newCode)) {
        return new Response(JSON.stringify({ success: false, message: "Invalid or missing 8-digit code format." }), {
            status: 400, headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const store = getStore(STORE_NAME);
        const currentCodesJSON = await store.get(CODES_KEY);
        let currentCodes = [];
        if (currentCodesJSON) {
            try {
              currentCodes = JSON.parse(currentCodesJSON);
              if (!Array.isArray(currentCodes)) currentCodes = [];
            } catch {
              currentCodes = [];
            }
        }

        const codeSet = new Set(currentCodes);
        if (!codeSet.has(newCode)) {
            currentCodes.push(newCode);
            await store.setJSON(CODES_KEY, currentCodes);
            console.log(`Code ${newCode} added.`);
            return new Response(JSON.stringify({ success: true, message: `Code ${newCode} added.` }), {
                status: 200, headers: { "Content-Type": "application/json" },
            });
        } else {
             console.log(`Code ${newCode} already exists.`);
             return new Response(JSON.stringify({ success: false, message: `Code ${newCode} already exists.` }), {
                 status: 409, // Conflict
                 headers: { "Content-Type": "application/json" },
             });
        }

    } catch (error) {
        console.error("Error adding code:", error);
        return new Response(JSON.stringify({ success: false, message: "Server error while adding code." }), {
            status: 500, headers: { "Content-Type": "application/json" },
        });
    }
};

export const config = {
    path: "/.netlify/functions/add-code",
};
