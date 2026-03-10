export const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL;
    if (!url && import.meta.env.PROD) {
        url = 'https://farewell-social-backend.onrender.com';
    } else if (!url) {
        url = 'http://localhost:5000';
    }
    return url.replace(/\/$/, ''); // Remove trailing slash if present
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
