export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1") && !envUrl.includes("0.0.0.0")) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("trycloudflare.com")) {
      return `https://${hostname}`;
    }
    if (hostname === "apps.pentagontextiles.com") {
      return `https://${hostname}:8000`;
    }
    if (hostname === "localhost") {
      return "http://localhost:8000";
    }
    return "http://172.16.16.100:8000";
  }
  
  return "http://localhost:8000";
};

