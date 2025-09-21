// Dynamic Resource Sections Management
class DynamicResources {
    constructor() {
        this.resourceContainer = null;
        this.staticResourceSections = null;
        this.isLoaded = false;
    }
    
    // Initialize the dynamic resources
    async init() {
        console.log('📚 Initializing dynamic resources...');
        
        try {
            // Find resource container
            this.resourceContainer = document.getElementById('dynamic-resources');
            if (!this.resourceContainer) {
                console.log('⚠️ Resource container not found, resources will remain static');
                return;
            }
            
            // Store static content as fallback
            this.staticResourceSections = this.resourceContainer.querySelector('.static-resource-sections');
            
            // Check if Supabase is configured
            if (!window.SupabaseHelper || !window.SupabaseHelper.isConfigured()) {
                console.log('⚠️ Supabase not configured, showing static resources');
                this.showStaticResources();
                return;
            }
            
            // Test connection
            const connectionOk = await window.SupabaseHelper.testConnection();
            if (!connectionOk) {
                console.log('⚠️ Supabase connection failed, showing static resources');
                this.showStaticResources();
                return;
            }
            
            // Load dynamic resource sections
            await this.loadResourceSections();
            this.isLoaded = true;
            console.log('✅ Dynamic resources loaded successfully');
            
        } catch (error) {
            console.error('❌ Error initializing dynamic resources:', error);
            this.showStaticResources();
        }
    }
    
    // Load resource sections from database
    async loadResourceSections() {
        try {
            const sections = await window.SupabaseHelper.getResourceSections();
            console.log(`📚 Loaded ${sections.length} resource sections`);
            
            if (sections.length === 0) {
                console.log('📚 No resource sections found in database - hiding resource sections');
                this.hideResourceSections();
                return;
            }
            
            this.renderResourceSections(sections);
            this.showResourceSections();
            
        } catch (error) {
            console.error('❌ Error loading resource sections:', error);
            console.log('📚 Database error - hiding resource sections');
            this.hideResourceSections();
        }
    }
    
    // Show resource sections
    showResourceSections() {
        if (this.resourceContainer) {
            this.resourceContainer.style.display = 'block';
        }
    }
    
    // Hide resource sections completely when no data
    hideResourceSections() {
        if (this.resourceContainer) {
            this.resourceContainer.style.display = 'none';
        }
        console.log('📚 Resource sections hidden (no data)');
    }
    
    // Render resource sections
    renderResourceSections(sections) {
        if (!this.resourceContainer) return;
        
        // Hide static content
        if (this.staticResourceSections) {
            this.staticResourceSections.style.display = 'none';
        }
        
        // Create dynamic resources container
        let dynamicContainer = this.resourceContainer.querySelector('.dynamic-resource-sections');
        if (!dynamicContainer) {
            dynamicContainer = document.createElement('div');
            dynamicContainer.className = 'dynamic-resource-sections';
            this.resourceContainer.appendChild(dynamicContainer);
        }
        
        // Clear existing content
        dynamicContainer.innerHTML = '';
        
        // Render each section
        sections.forEach(section => {
            const sectionElement = this.createResourceSectionElement(section);
            dynamicContainer.appendChild(sectionElement);
        });
    }
    
    // Create resource section HTML element
    createResourceSectionElement(section) {
        // Create section title
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.innerHTML = `<h2 class="section-text">${section.title}</h2>`;
        
        // Create resource item
        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'resource-item';
        resourceDiv.setAttribute('data-section-id', section.id);
        
        // Create content with image and description
        let content = '';
        
        if (section.image_url) {
            content += `<img src="${section.image_url}" alt="${section.title}" class="resource-image">`;
        }
        
        content += `<p class="resource-description">${this.formatDescription(section.description)}</p>`;
        
        resourceDiv.innerHTML = content;
        
        // Create container for both elements
        const containerDiv = document.createElement('div');
        containerDiv.appendChild(sectionDiv);
        containerDiv.appendChild(resourceDiv);
        
        // Add spacer after each section (except the last one)
        const spacerDiv = document.createElement('div');
        spacerDiv.className = 'spacer';
        spacerDiv.style.height = '2rem';
        containerDiv.appendChild(spacerDiv);
        
        return containerDiv;
    }
    
    // Format description text (preserve HTML formatting)
    formatDescription(description) {
        // Preserve line breaks and basic HTML formatting
        return description.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    }
    
    // Show static resources as fallback
    showStaticResources() {
        if (!this.resourceContainer || !this.staticResourceSections) {
            console.log('📚 No static resource sections found');
            return;
        }
        
        // Hide dynamic content
        const dynamicContainer = this.resourceContainer.querySelector('.dynamic-resource-sections');
        if (dynamicContainer) {
            dynamicContainer.style.display = 'none';
        }
        
        // Show static content only if database is unavailable
        this.staticResourceSections.style.display = 'block';
        console.log('📚 Showing static resource content (database unavailable)');
    }
    
    // Refresh resource sections (useful for admin updates)
    async refresh() {
        if (!this.isLoaded) {
            await this.init();
            return;
        }
        
        try {
            await this.loadResourceSections();
            console.log('🔄 Resources refreshed');
        } catch (error) {
            console.error('❌ Error refreshing resources:', error);
        }
    }
}

// Initialize resources when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for other scripts to load
    setTimeout(async () => {
        window.dynamicResources = new DynamicResources();
        await window.dynamicResources.init();
    }, 1000);
});

// Export for use in other files
window.DynamicResources = DynamicResources;
