// API Configuration — local dev vs deployed frontend
const isLocalApi =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";
const API_URL = isLocalApi
    ? "http://localhost:8000/"
    : "https://lit-todo-app-backend.onrender.com/";

// State
const state = {
    token: localStorage.getItem('lit_token') || [],
    user: null, // Fetched if token exists
    guestTodos: [],
    userTodos: []
};

// DOM Elements
const views = {
    guest: document.getElementById('view-guest'),
    login: document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    dashboard: document.getElementById('view-dashboard')
};

const ui = {
    loading: document.getElementById('loading-overlay'),
    toast: document.getElementById('toast'),
    // Guest
    guestList: document.getElementById('list-guest-todos'),
    formGuestAdd: document.getElementById('form-add-guest-todo'),
    inputGuestTodo: document.getElementById('input-guest-todo'),
    // Dashboard
    userList: document.getElementById('list-user-todos'),
    formUserAdd: document.getElementById('form-add-user-todo'),
    inputUserTodo: document.getElementById('input-user-todo'),
    statTotal: document.getElementById('stat-total'),
    statDone: document.getElementById('stat-done'),
    userAvatar: document.getElementById('user-avatar'),
    userDisplay: document.getElementById('user-display'),
    // Auth
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    loginBanner: document.getElementById('login-banner'),
    registerBanner: document.getElementById('register-banner'),
    registerBannerSuccess: document.getElementById('register-banner-success'),
};

// --- Utilities ---
const showToast = (msg, type = 'info') => {
    ui.toast.className = `fixed bottom-7 left-1/2 -translate-x-1/2 translate-y-5 px-5 py-3 rounded-xl text-[13px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.2)] opacity-0 transition-all duration-300 pointer-events-none z-[999] whitespace-nowrap flex items-center gap-2`;
    let bgColor = '#1a1a1a';
    let icon = '💡🎉🎊';
    if (type === 'error') { bgColor = '#dc2626'; icon = '❌'; }
    if (type === 'success') { bgColor = '#16a34a'; icon = '✅'; }
    
    ui.toast.style.background = bgColor;
    ui.toast.innerHTML = `<span>${icon}</span> ${msg}`;
    
    // Animate in
    setTimeout(() => {
        ui.toast.style.opacity = '1';
        ui.toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Animate out
    setTimeout(() => {
        ui.toast.style.opacity = '0';
        ui.toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
};

const setLoading = (isLoading) => {
    if (isLoading) {
        ui.loading.classList.remove('hidden');
        ui.loading.classList.add('flex');
    } else {
        ui.loading.classList.remove('flex');
        ui.loading.classList.add('hidden');
    }
};

const escapeHTML = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// --- API Wrapper ---
const apiFetch = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    try {
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.detail || data.message || `Error ${res.status}`);
        }
        return data;
    } catch (err) {
        throw err;
    }
};

// --- Application Logic ---
const app = {
    init: async () => {
        // Bind events
        ui.formGuestAdd.addEventListener('submit', app.handleGuestAdd);
        ui.formLogin.addEventListener('submit', app.handleLogin);
        ui.formRegister.addEventListener('submit', app.handleRegister);
        ui.formUserAdd.addEventListener('submit', app.handleUserAdd);

        if (state.token) {
            // Validate token / load user dashboard
            app.showView('dashboard');
            await app.loadDashboard();
        } else {
            app.showView('guest');
            await app.loadGuestTodos();
        }
    },

    showView: (viewName) => {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
        if (viewName === 'guest') app.loadGuestTodos();
    },

    logout: () => {
        state.token = null;
        state.user = null;
        state.userTodos = [];
        localStorage.removeItem('lit_token');
        app.showView('guest');
        showToast('Signed out successfully.', 'info');
    },

    // --- Guest Logic ---
    loadGuestTodos: async () => {
        try {
            state.guestTodos = await apiFetch('/guest/todos');
            app.renderGuestTodos();
        } catch (err) {
            console.error('Failed to load guest todos', err);
        }
    },

    handleGuestAdd: async (e) => {
        e.preventDefault();
        const title = ui.inputGuestTodo.value.trim();
        if (!title) return;
        ui.inputGuestTodo.value = '';
        
        try {
            const newTodo = await apiFetch('/guest/todos', {
                method: 'POST',
                body: JSON.stringify({ title })
            });
            state.guestTodos.unshift(newTodo);
            app.renderGuestTodos();
            showToast('Public task added!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    renderGuestTodos: () => {
        ui.guestList.innerHTML = '';
        if (state.guestTodos.length === 0) {
            ui.guestList.innerHTML = app.getEmptyStateHTML('No public tasks yet. Be the first!');
            return;
        }

        const html = state.guestTodos.map(todo => `
            <div class="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] overflow-hidden transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] p-4 task-animate">
                <p class="text-sm font-medium text-littext break-words">${escapeHTML(todo.title)}</p>
                <div class="mt-2 text-[9px] font-mono text-litmuted tracking-widest uppercase">
                    ${new Date(todo.created_at).toLocaleDateString()}
                </div>
            </div>
        `).join('');
        ui.guestList.innerHTML = html;
    },

    // --- Auth Logic ---
    handleLogin: async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        ui.loginBanner.classList.add('hidden');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div>';

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            state.token = data.access_token;
            localStorage.setItem('lit_token', state.token);
            
            // Try fetching todos to verify auth worked and get user data implicitly
            await app.loadDashboard();
            app.showView('dashboard');
        } catch (err) {
            ui.loginBanner.textContent = err.message || 'Login failed.';
            ui.loginBanner.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Sign In';
        }
    },

    handleRegister: async (e) => {
        e.preventDefault();
        const first_name = document.getElementById('reg-firstname').value.trim();
        const last_name = document.getElementById('reg-lastname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('register-btn');
        
        ui.registerBanner.classList.add('hidden');
        ui.registerBannerSuccess.classList.add('hidden');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div>';

        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ first_name, last_name, email, password })
            });
            ui.registerBannerSuccess.textContent = 'Account created! Please sign in.';
            ui.registerBannerSuccess.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('login-email').value = email;
                app.showView('login');
            }, 1500);
        } catch (err) {
            ui.registerBanner.textContent = err.message || 'Registration failed.';
            ui.registerBanner.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Create Account';
        }
    },

    // --- Dashboard Logic ---
    loadDashboard: async () => {
        setLoading(true);
        try {
            state.userTodos = await apiFetch('/todos');
            // Decode token manually just to get email for display if needed
            // However, our MVP doesn't strictly need the user's name if we didn't add an endpoint to fetch current user profile.
            // Let's just update stats and list.
            ui.userDisplay.textContent = "My Tasks";
            ui.userAvatar.textContent = "U";
            app.renderUserTodos();
        } catch (err) {
            app.logout();
            showToast('Session expired, please sign in again.', 'error');
        } finally {
            setLoading(false);
        }
    },

    handleUserAdd: async (e) => {
        e.preventDefault();
        const title = ui.inputUserTodo.value.trim();
        if (!title) return;
        ui.inputUserTodo.value = '';
        
        try {
            const newTodo = await apiFetch('/todos', {
                method: 'POST',
                body: JSON.stringify({ title, status: "PENDING" })
            });
            state.userTodos.unshift(newTodo);
            app.renderUserTodos();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    toggleTodo: async (id) => {
        const todo = state.userTodos.find(t => t.id === id);
        if (!todo) return;
        const newStatus = todo.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        const oldStatus = todo.status;
        todo.status = newStatus;
        app.renderUserTodos(); // Optimistic

        try {
            await apiFetch(`/todos/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            todo.status = oldStatus; // Revert
            app.renderUserTodos();
            showToast(err.message, 'error');
        }
    },

    deleteTodo: async (id) => {
        const snapshot = [...state.userTodos];
        state.userTodos = state.userTodos.filter(t => t.id !== id);
        app.renderUserTodos(); // Optimistic

        try {
            await apiFetch(`/todos/${id}`, { method: 'DELETE' });
        } catch (err) {
            state.userTodos = snapshot; // Revert
            app.renderUserTodos();
            showToast(err.message, 'error');
        }
    },

    clearCompleted: async () => {
        const completed = state.userTodos.filter(t => t.status === 'COMPLETED');
        if (!completed.length) return;
        
        const snapshot = [...state.userTodos];
        state.userTodos = state.userTodos.filter(t => t.status !== 'COMPLETED');
        app.renderUserTodos(); // Optimistic

        for (const todo of completed) {
            try {
                await apiFetch(`/todos/${todo.id}`, { method: 'DELETE' });
            } catch (err) {
                console.error("Failed to delete", todo.id);
            }
        }
        showToast('Cleared completed tasks.', 'success');
    },

    renderUserTodos: () => {
        ui.userList.innerHTML = '';
        ui.statTotal.textContent = state.userTodos.length;
        ui.statDone.textContent = state.userTodos.filter(t => t.status === 'COMPLETED').length;

        if (state.userTodos.length === 0) {
            ui.userList.innerHTML = app.getEmptyStateHTML('Nothing lit yet. Add your first task above.');
            return;
        }

        const html = state.userTodos.map(todo => {
            const isDone = todo.status === 'COMPLETED';
            return `
                <div class="task-item bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] overflow-hidden transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] task-animate">
                    <div class="flex items-center gap-3 p-4">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium break-words ${isDone ? 'line-through text-litmuted' : 'text-littext'}">
                                ${escapeHTML(todo.title)}
                            </p>
                        </div>
                        <div class="flex items-center gap-2.5 shrink-0">
                            <button onclick="app.toggleTodo(${todo.id})" class="w-11 h-6 rounded-full relative cursor-pointer border-none shrink-0 transition-colors ${isDone ? 'bg-litgreen' : 'bg-gray-200'}" title="Toggle status">
                                <div class="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${isDone ? 'translate-x-[20px]' : ''}"></div>
                            </button>
                            <button onclick="app.deleteTodo(${todo.id})" class="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-red-500 text-xs font-semibold font-sans cursor-pointer transition-all hover:bg-red-100 whitespace-nowrap">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,3 11,3"/><path d="M4,3V2h4v1"/><path d="M2,3l.6,7.5a.5.5,0,0,0,.5.5h5.8a.5.5,0,0,0,.5-.5L10,3"/><line x1="4.5" y1="5.5" x2="4.5" y2="9"/><line x1="7.5" y1="5.5" x2="7.5" y2="9"/></svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        ui.userList.innerHTML = html;
    },

    getEmptyStateHTML: (msg) => `
        <div class="text-center py-[72px]">
            <div class="empty-float">
                <div class="w-[60px] h-[60px] bg-[rgba(31,86,254,0.08)] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="rgba(31,86,254,0.4)" stroke-width="1.5" stroke-linecap="round">
                        <rect x="4" y="4" width="18" height="18" rx="4"/><path d="M9 13h8M13 9v8"/>
                    </svg>
                </div>
                <p class="text-[#a08c50] text-sm font-mono">${msg}</p>
            </div>
        </div>
    `
};

// Start
document.addEventListener('DOMContentLoaded', app.init);
