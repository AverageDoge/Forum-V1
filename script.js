document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('post-form');
    const forumFeed = document.getElementById('forum-feed');
    const pendingFeed = document.getElementById('pending-feed');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const successMsg = document.getElementById('success-message');

    // WARNING: Make sure there is NO slash at the very end of this URL
    const API_URL = 'https://white-band-1ffd.michael-le.workers.dev';
    
    let isAdmin = false;

    // Load posts from the database on startup
    fetchPosts();

    // 1. Submit a post
    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = postForm.querySelector('button');
        submitBtn.innerText = "Sending..."; // Visual feedback that it clicked

        try {
            const newPost = {
                title: document.getElementById('post-title').value,
                category: document.getElementById('post-category').value,
                content: document.getElementById('post-content').value,
                date: new Date().toLocaleDateString(),
                status: 'pending' 
            };

            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost)
            });

            const data = await response.json();

            // If the Cloudflare Worker sent back an error, pop it up
            if (!response.ok || data.error) {
                throw new Error(data.error || `Server responded with ${response.status}`);
            }

            postForm.reset();
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 3000);
            
            fetchPosts();
        } catch (error) {
            // POP UP THE ERROR ON SCREEN
            alert("Error submitting post: " + error.message);
        } finally {
            submitBtn.innerText = "Submit for Review";
        }
    });

    // 2. Admin Login
    adminLoginBtn.addEventListener('click', () => {
        if (!isAdmin) {
            const password = prompt("Enter Admin Password:");
            if (password === 'admin') { 
                isAdmin = true;
                adminDashboard.classList.remove('hidden');
                adminLoginBtn.innerText = "Logout Admin";
                fetchPosts();
            } else {
                alert("Incorrect password");
            }
        } else {
            isAdmin = false;
            adminDashboard.classList.add('hidden');
            adminLoginBtn.innerText = "Admin Login";
            fetchPosts();
        }
    });

    // 3. Fetch Posts
    async function fetchPosts() {
        try {
            forumFeed.innerHTML = '<p>Loading posts...</p>';
            
            const response = await fetch(`${API_URL}/posts`);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || `Server responded with ${response.status}`);
            }

            renderPosts(data);
        } catch (error) {
            forumFeed.innerHTML = `<p style="color: red;">Failed to load posts. Error: ${error.message}</p>`;
        }
    }

    // 4. Render Posts
    function renderPosts(posts) {
        forumFeed.innerHTML = '';
        pendingFeed.innerHTML = '';

        // If the database returns nothing, ensure posts is an empty array
        const safePosts = Array.isArray(posts) ? posts : [];
        
        const approvedPosts = safePosts.filter(p => p.status === 'approved');
        const pendingPosts = safePosts.filter(p => p.status === 'pending');

        if (approvedPosts.length === 0) {
            forumFeed.innerHTML = '<p>No approved posts yet.</p>';
        } else {
            approvedPosts.forEach(post => forumFeed.appendChild(createPostHTML(post, false)));
        }

        if (isAdmin) {
            if (pendingPosts.length === 0) {
                pendingFeed.innerHTML = '<p>No posts pending approval.</p>';
            } else {
                pendingPosts.forEach(post => pendingFeed.appendChild(createPostHTML(post, true)));
            }
        }
    }

    // Helper
    function createPostHTML(post, isPendingAdminView) {
        const div = document.createElement('div');
        div.className = 'forum-post';
        
        let html = `
            <span class="category-tag">${post.category}</span>
            <h3>${post.title}</h3>
            <div class="post-meta">Submitted on ${post.date}</div>
            <p>${post.content}</p>
        `;

        if (isPendingAdminView) {
            html += `
                <button class="approve-btn" onclick="moderatePost(${post.id}, 'approved')">Approve Post</button>
                <button class="reject-btn" onclick="moderatePost(${post.id}, 'rejected')">Reject / Delete</button>
            `;
        }

        div.innerHTML = html;
        return div;
    }

    // 5. Admin Actions
    window.moderatePost = async function(id, action) {
        try {
            const endpoint = action === 'approved' ? '/approve' : '/delete';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.error || `Server responded with ${response.status}`);
            }
            
            fetchPosts(); 
        } catch (error) {
            alert("Error updating post: " + error.message);
        }
    };
});
