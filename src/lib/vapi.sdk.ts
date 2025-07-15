import Vapi from "@vapi-ai/web"

// Initialize VAPI with error handling
let vapi: Vapi;

try {
  if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
    console.error('VAPI Public Key is missing! Please check your environment variables.');
    vapi = new Vapi('placeholder-key');
  } else {
    vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
  }
} catch (error) {
  console.error('Failed to initialize VAPI:', error);
  vapi = new Vapi('placeholder-key');
}

export { vapi };