// netlify/functions/verify-code.js (Original Code)
import { getStore } from "@netlify/blobs";

const STORE_NAME = "active-verification-codes";
const CODES_KEY = "valid_codes_list";

export default async (req, context) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", Allow: "POST" },
        });
    }

    let requestBody;
    try {
        requestBody = await req.json();
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { code: submittedCode } = requestBody;

    if (!submittedCode || typeof submittedCode !== 'string' || submittedCode.length !== 8) {
        return new Response(JSON.stringify({ success: false, message: "Invalid or missing 8-digit code." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const store = getStore(STORE_NAME);
        const currentCodesJSON = await store.get(CODES_KEY);
        let currentCodes = [];
        if (currentCodesJSON) {
            try {
              currentCodes = JSON.parse(currentCodesJSON);
              if (!Array.isArray(currentCodes)) currentCodes = []; // Handle non-array data
            } catch (parseError){
              console.error("Failed to parse codes from blob store:", parseError);
              currentCodes = []; // Reset if parsing fails
            }
        }

        const codeIndex = currentCodes.indexOf(submittedCode);

        if (codeIndex > -1) {
            currentCodes.splice(codeIndex, 1); // Remove the code
            await store.setJSON(CODES_KEY, currentCodes); // Save updated list

            console.log(`Code ${submittedCode} verified and removed.`);
            return new Response(JSON.stringify({ success: true, message: "Verification Successful!" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } else {
            console.log(`Code ${submittedCode} not found or already used.`);
            return new Response(JSON.stringify({ success: false, message: "Invalid or expired verification code." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.error("Error during verification:", error);
        return new Response(JSON.stringify({ success: false, message: "Server error during verification." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const config = {
    path: "/.netlify/functions/verify-code",
};