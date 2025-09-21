// Dynamic Grid System for SDSU Newsletter
class DynamicGrid {
    
    constructor(containerSelector = '.grid-container') {
        this.container = document.querySelector(containerSelector);
        this.announcements = [];
        this.isLoading = false;
    }
    
    // Load announcements from Supabase and render them
    async loadAndRender() {
        try {
            this.setLoading(true);
            this.announcements = await SupabaseHelper.getAnnouncements();
            this.render();
        } catch (error) {
            console.error('Error loading announcements:', error);
            this.showError('Failed to load announcements. Please try again later.');
        } finally {
            this.setLoading(false);
        }
    }
    
    // Render all announcements as grid items
    render() {
        if (!this.container) {
            console.error('Grid container not found');
            return;
        }
        
        // Clear existing content
        this.container.innerHTML = '';
        
        if (this.announcements.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <h3>No announcements yet</h3>
                    <p>Check back later for updates!</p>
                </div>
            `;
            return;
        }
        
        // Create grid items
        this.announcements.forEach(announcement => {
            const gridItem = this.createGridItem(announcement);
            this.container.appendChild(gridItem);
        });
        
        // Trigger animation system for newly added content
        this.triggerAnimations();
    }
    
    // Trigger scroll animations for the newly loaded content
    triggerAnimations() {
        // Dispatch custom event to notify animation system
        const event = new CustomEvent('dynamicContentLoaded', {
            detail: { type: 'announcements', container: this.container }
        });
        document.dispatchEvent(event);
        
        // Also directly trigger animations if the system is available
        if (window.ScrollAnimations && window.ScrollAnimations.addAnimationsToDynamicContent) {
            setTimeout(() => {
                window.ScrollAnimations.addAnimationsToDynamicContent();
            }, 100);
        }
    }
    
    // Create a single grid item element
    createGridItem(announcement) {
        const gridItem = document.createElement('div');
        gridItem.className = `grid-item ${announcement.layout === 'reverse' ? 'reverse' : ''}`;
        gridItem.setAttribute('data-id', announcement.id);
        
        const imageElement = this.createImageElement(announcement);
        const textElement = this.createTextElement(announcement);
        
        // Add elements in correct order based on layout
        if (announcement.layout === 'reverse') {
            gridItem.appendChild(textElement);
            gridItem.appendChild(imageElement);
        } else {
            gridItem.appendChild(imageElement);
            gridItem.appendChild(textElement);
        }
        
        return gridItem;
    }
    
    // Create image element for grid item
    createImageElement(announcement) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'grid-image';
        
        if (announcement.image_url) {
            const img = document.createElement('img');
            img.src = announcement.image_url;
            img.alt = announcement.title;
            img.loading = 'lazy'; // Lazy loading for performance
            
            // Add error handling for missing images
            img.onerror = function() {
                this.src = 'assets/placeholder.png'; // Fallback image
                this.alt = 'Image not available';
            };
            
            imageDiv.appendChild(img);
        } else {
            // Placeholder for missing image
            imageDiv.innerHTML = `
                <div style="
                    width: 100%; 
                    height: 200px; 
                    background: #f0f0f0; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    border-radius: 8px;
                    color: #999;
                ">
                    <span>No Image</span>
                </div>
            `;
        }
        
        return imageDiv;
    }
    
    // Create text element for grid item
    createTextElement(announcement) {
        const textDiv = document.createElement('div');
        textDiv.className = 'grid-text';
        
        // Create title
        const title = document.createElement('h3');
        title.textContent = announcement.title;
        textDiv.appendChild(title);
        
        // Create description
        const description = document.createElement('p');
        description.innerHTML = this.formatText(announcement.description);
        textDiv.appendChild(description);
        
        // Add details if they exist
        if (announcement.details && announcement.details.trim()) {
            const details = document.createElement('div');
            details.innerHTML = this.formatText(announcement.details);
            textDiv.appendChild(details);
        }
        
        return textDiv;
    }
    
    // Format text to handle line breaks and links (but preserve existing HTML)
    formatText(text) {
        if (!text) return '';
        
        // If text already contains HTML anchor tags, just convert line breaks
        if (text.includes('<a ') && text.includes('</a>')) {
            return text.replace(/\n/g, '<br>');
        }
        
        // Otherwise, apply full formatting for plain text
        return text
            // Convert line breaks to HTML breaks
            .replace(/\n/g, '<br>')
            // Convert URLs to clickable links
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            // Convert email addresses to mailto links
            .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
    }
    
    // Set loading state
    setLoading(loading) {
        this.isLoading = loading;
        
        if (!this.container) return;
        
        if (loading) {
            this.container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <div style="
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #A6192E;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    "></div>
                    <p>Loading announcements...</p>
                </div>
            `;
            
            // Add CSS animation if not already present
            this.addSpinnerCSS();
        }
    }
    
    // Add spinner CSS animation
    addSpinnerCSS() {
        if (!document.getElementById('spinner-css')) {
            const style = document.createElement('style');
            style.id = 'spinner-css';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Show error message
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div style="
                background: #ffe6e6;
                color: #d32f2f;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                border: 1px solid #d32f2f;
            ">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="window.dynamicGrid.loadAndRender()" style="
                    background: #A6192E;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">
                    Try Again
                </button>
            </div>
        `;
    }
    
    // Refresh the grid (useful for real-time updates)
    async refresh() {
        await this.loadAndRender();
    }
    
    // Add new announcement and refresh
    async addAnnouncement(announcementData) {
        try {
            await SupabaseHelper.createAnnouncement(announcementData);
            await this.refresh();
            return true;
        } catch (error) {
            console.error('Error adding announcement:', error);
            throw error;
        }
    }
    
    // Update announcement and refresh
    async updateAnnouncement(id, announcementData) {
        try {
            await SupabaseHelper.updateAnnouncement(id, announcementData);
            await this.refresh();
            return true;
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    }
    
    // Delete announcement and refresh
    async deleteAnnouncement(id) {
        try {
            await SupabaseHelper.deleteAnnouncement(id);
            await this.refresh();
            return true;
        } catch (error) {
            console.error('Error deleting announcement:', error);
            throw error;
        }
    }
    
    // Get announcement by ID
    getAnnouncementById(id) {
        return this.announcements.find(announcement => announcement.id === id);
    }
    
    // Static method to initialize and load grid
    static async initialize(containerSelector = '.grid-container') {
        const grid = new DynamicGrid(containerSelector);
        await grid.loadAndRender();
        return grid;
    }
}

// Make DynamicGrid available globally
window.DynamicGrid = DynamicGrid;

// Auto-initialize when DOM is loaded (for main page)
document.addEventListener('DOMContentLoaded', async () => {
    // Only auto-initialize on pages that have the grid container
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer && !window.location.pathname.includes('admin')) {
        try {
            // Test Supabase connection first
            const connected = await SupabaseHelper.testConnection();
            if (connected) {
                window.dynamicGrid = await DynamicGrid.initialize();
                console.log('✅ Dynamic grid initialized successfully');
            } else {
                console.warn('⚠️ Supabase not connected - using static content');
            }
        } catch (error) {
            console.error('❌ Failed to initialize dynamic grid:', error);
            console.warn('⚠️ Falling back to static content');
        }
    }
});
