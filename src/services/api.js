const TOKEN_KEY = 'study_jwt_token';

// Helper to construct headers with JWT token
function getHeaders(extraHeaders = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Request Helper
async function request(url, options = {}) {
  const config = {
    ...options,
    headers: getHeaders(options.headers)
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  // Authentication
  auth: {
    setToken(token) {
      localStorage.setItem(TOKEN_KEY, token);
    },
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },
    logout() {
      localStorage.removeItem(TOKEN_KEY);
    },
    async register(name, email, password) {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      if (data.token) this.setToken(data.token);
      return data.user;
    },
    async login(email, password) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) this.setToken(data.token);
      return data.user;
    },
    async me() {
      return await request('/api/auth/me');
    }
  },

  // Users & Matches
  users: {
    async updateProfile(profile) {
      return await request('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
    },
    async getMatches() {
      return await request('/api/users/matches');
    },
    async getList() {
      return await request('/api/users/list');
    }
  },

  // Groups & Workspaces
  groups: {
    async getAll() {
      return await request('/api/groups');
    },
    async create(group) {
      return await request('/api/groups', {
        method: 'POST',
        body: JSON.stringify(group)
      });
    },
    async join(groupId) {
      return await request(`/api/groups/${groupId}/join`, {
        method: 'POST'
      });
    },
    async leave(groupId) {
      return await request(`/api/groups/${groupId}/leave`, {
        method: 'POST'
      });
    },
    async invite(groupId, studentId) {
      return await request(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ studentId })
      });
    },
    async scheduleMeeting(groupId, meeting) {
      return await request(`/api/groups/${groupId}/meetings`, {
        method: 'POST',
        body: JSON.stringify(meeting)
      });
    },
    async addResource(groupId, resource) {
      return await request(`/api/groups/${groupId}/resources`, {
        method: 'POST',
        body: JSON.stringify(resource)
      });
    },
    async upvoteResource(groupId, resourceId) {
      return await request(`/api/groups/${groupId}/resources/${resourceId}/upvote`, {
        method: 'POST'
      });
    },
    async addGoal(groupId, goal) {
      return await request(`/api/groups/${groupId}/goals`, {
        method: 'POST',
        body: JSON.stringify(goal)
      });
    },
    async toggleSubtask(groupId, goalId, subtaskId) {
      return await request(`/api/groups/${groupId}/goals/${goalId}/subtasks/${subtaskId}/toggle`, {
        method: 'POST'
      });
    },
    async deleteGoal(groupId, goalId) {
      return await request(`/api/groups/${groupId}/goals/${goalId}`, {
        method: 'DELETE'
      });
    }
  }
};
