const getApiUrl = () => {
    // In production, we use Vercel's proxy (/api/...) to avoid CORS issues.
    // In development, we use the local backend URL.
    if (import.meta.env.PROD) {
        return '';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

export const api = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}${endpoint}`;

    // Ensure headers are properly initialized
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    // Make the fetch call
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle non-ok responses
    if (!response.ok) {
        // Try to parse the error message from the response body
        const errorData = await response.json().catch(() => ({
            message: 'An unknown error occurred.',
        }));
        throw new Error(errorData.message || 'API request failed');
    }

    // Handle responses with no content
    if (response.status === 204) {
        return;
    }

    return response.json();
};
