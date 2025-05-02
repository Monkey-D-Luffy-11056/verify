export default async (req, context) => {
  console.log("Simplified verify-code function invoked!"); // Add a log
  return new Response("Hello from verify-code!", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
};

// Optional: keep the config if you want, or remove it for this test
// export const config = {
//   path: "/.netlify/functions/verify-code",
// };
