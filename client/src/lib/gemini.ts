function getGeminiApiKeys(): string[] {
  const rawKeys: Array<string | undefined> = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
  ];

  const keys = rawKeys
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map((k) => k.trim());

  return Array.from(new Set(keys));
}

const GEMINI_API_KEYS = getGeminiApiKeys();
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const isGeminiConfigured = () => GEMINI_API_KEYS.length > 0;

// Rate limiting: track last request time and queue
let lastRequestTime = 0;
let requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;

let nextKeyIndex = 0;

function getNextStartingKeyIndex(): number {
  if (GEMINI_API_KEYS.length === 0) return 0;
  const idx = nextKeyIndex;
  nextKeyIndex = (nextKeyIndex + 1) % GEMINI_API_KEYS.length;
  return idx;
}

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      await request();
    }
  }
  isProcessingQueue = false;
}

export async function generateContent(prompt: string, retries = MAX_RETRIES): Promise<string> {
  if (!isGeminiConfigured()) {
    return "Error: Gemini API key is not configured. Please add VITE_GEMINI_API_KEY (or VITE_GEMINI_API_KEY_1..VITE_GEMINI_API_KEY_5) to your environment variables.";
  }

  const maxAttempts = Math.max(retries, GEMINI_API_KEYS.length - 1);
  const startingKeyIndex = getNextStartingKeyIndex();

  return new Promise((resolve) => {
    const executeRequest = async (attempt: number, keyIndex: number): Promise<void> => {
      try {
        const apiKey = GEMINI_API_KEYS[keyIndex] || GEMINI_API_KEYS[0];
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.error?.message || `API request failed with status ${response.status}`;
          
          // Check for rate limit or overload errors
          const isRateLimit = response.status === 429 || 
                             errorMessage.toLowerCase().includes('overloaded') ||
                             errorMessage.toLowerCase().includes('quota') ||
                             errorMessage.toLowerCase().includes('rate limit');
          
          if (isRateLimit && attempt < maxAttempts) {
            const nextIndex = GEMINI_API_KEYS.length > 1
              ? (keyIndex + 1) % GEMINI_API_KEYS.length
              : keyIndex;

            if (GEMINI_API_KEYS.length <= 1) {
              // Exponential backoff for rate limits
              const backoffDelay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
              await new Promise(r => setTimeout(r, backoffDelay));
            }

            return executeRequest(attempt + 1, nextIndex);
          }
          
          resolve(`Error: ${errorMessage}`);
          return;
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            return executeRequest(attempt + 1, keyIndex);
          }
          resolve("Error: No response generated from Gemini.");
          return;
        }

        const candidate = data.candidates[0];
        if (!candidate.content?.parts?.[0]?.text) {
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            return executeRequest(attempt + 1, keyIndex);
          }
          resolve("Error: Invalid response format from Gemini.");
          return;
        }

        resolve(candidate.content.parts[0].text);
      } catch (error) {
        if (attempt < maxAttempts) {
          // Retry on network errors with exponential backoff
          const backoffDelay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, backoffDelay));
          return executeRequest(attempt + 1, keyIndex);
        }
        
        console.error("Gemini API error:", error);
        resolve(`Error: ${error instanceof Error ? error.message : "Failed to generate content"}`);
      }
    };

    requestQueue.push(() => executeRequest(0, startingKeyIndex));
    processQueue();
  });
}
