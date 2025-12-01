const API_BASE_URL = 'http://localhost:5000/api';

export const authAPI = {
  login: (email, password) => 
    fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }).then(response => response.json()),

  register: (userData) => 
    fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }).then(response => response.json()),
};

export const testDB = () => 
  fetch(`${API_BASE_URL}/test-db`).then(response => response.json());