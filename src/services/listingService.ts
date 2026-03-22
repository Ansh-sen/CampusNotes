const API_URL = 'http://localhost:3001/api';

export const listingService = {
  async getListings() {
    const response = await fetch(`${API_URL}/listings`);
    return response.json();
  },

  async getMyListings(jwt: string) {
    const response = await fetch(`${API_URL}/listings/me`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async getListing(id: string) {
    const response = await fetch(`${API_URL}/listings/${id}`);
    return response.json();
  },

  async createListing(listingData: any, jwt: string) {
    const response = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(listingData)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create listing');
    }
    return response.json();
  },

  async updateListing(id: string, listingData: any, jwt: string) {
    const response = await fetch(`${API_URL}/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(listingData)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update listing');
    }
    return response.json();
  },

  async deleteListing(id: string, jwt: string) {
    const response = await fetch(`${API_URL}/listings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async uploadImage(file: File, jwt: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/messages/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
      body: formData
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Image upload failed');
    }
    return response.json();
  },

  async uploadFile(file: File, jwt: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/messages/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
      body: formData
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'File upload failed');
    }
    return response.json();
  },

  // NEW METHODS FOR SELL PAGE
  async getRequestCount(subject_code: string, jwt: string) {
    const response = await fetch(`${API_URL}/requests/by-subject?subject_code=${subject_code}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async suggestTags(data: { subject_name: string, material_type: string, programme: string, branch: string, semester: string }, jwt: string) {
    const response = await fetch(`${API_URL}/listings/suggest-tags`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}` 
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async checkDuplicate(image_url: string, jwt: string) {
    const response = await fetch(`${API_URL}/listings/check-duplicate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}` 
      },
      body: JSON.stringify({ image_url })
    });
    return response.json();
  },

  async getPriceRange(subject_code: string, material_type: string, jwt: string) {
    const response = await fetch(`${API_URL}/listings/price-range?subject_code=${subject_code}&material_type=${material_type}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async getMyDraft(jwt: string) {
    const response = await fetch(`${API_URL}/listings/my-draft`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async saveDraft(data: any, jwt: string) {
    const response = await fetch(`${API_URL}/listings/draft`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}` 
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
