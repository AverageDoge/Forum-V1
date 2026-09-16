// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('post-form');
    const forumFeed = document.getElementById('forum-feed');

    // Load existing posts from local storage on startup
    let posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
    renderPosts();

    // Handle form submission
    postForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent page reload

        // Get input values
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const date = new Date().toLocaleString();

        // Create post object
        const newPost = {
            id: Date.now(),
            title: title,
            content: content,
            date: date
        };

        // Add to array and save to local storage
        posts.unshift(newPost); // Adds new post to the top
        localStorage.setItem('forumPosts', JSON.stringify(posts));

        // Clear the form
        postForm.reset();

        // Update the display
        renderPosts();
    });

    // Function to display posts
    function renderPosts() {
        // Clear current feed
        forumFeed.innerHTML = '';

        if (posts.length === 0) {
            forumFeed.innerHTML = '<p>No posts yet. Be the first to start a discussion!</p>';
            return;
        }

        // Generate HTML for each post
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'forum-post';
            
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <div class="post-meta">Posted on ${post.date} by Anonymous</div>
                <p>${post.content}</p>
            `;
            
            forumFeed.appendChild(postElement);
        });
    }
});
