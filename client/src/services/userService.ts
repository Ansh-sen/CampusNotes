import { API_URL } from '@/config';

export const userService = {
  submitVerification: async (data: { id_image_url: string; enrollment_number: string }, jwt: string) => {
    const response = await fetch(`${API_URL}/users/submit-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to submit verification');
    return result;
  }
};
