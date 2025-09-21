// Admin Panel JavaScript for SDSU Newsletter
class AdminPanel {
    
    constructor() {
        this.currentEditId = null;
        this.isSubmitting = false;
        this.dynamicGrid = null;
        this.init();
    }
    
    // Initialize admin panel
    async init() {
        // Check if SupabaseHelper is available
        if (typeof SupabaseHelper === 'undefined') {
            this.showMessage('Error: Supabase configuration not loaded. Please refresh the page.', 'error');
            console.error('SupabaseHelper is not defined. Check if supabase-config.js loaded properly.');
            return;
        }
        
        // Check if Supabase is properly configured
        const configStatus = SupabaseHelper.getConfigurationStatus();
        if (!configStatus.configured) {
            this.showMessage(`Configuration Error: ${configStatus.message}`, 'error');
            return;
        }
        
        this.bindEvents();
        await this.loadAnnouncements();
        
        // Test Supabase connection
        try {
            const connected = await SupabaseHelper.testConnection();
            if (!connected) {
                this.showMessage('Warning: Could not connect to Supabase. Please check your configuration.', 'error');
            } else {
                this.showMessage('Connected to database successfully!', 'success');
            }
        } catch (error) {
            this.showMessage('Error: Supabase connection issue. Check console for details.', 'error');
            console.error('Supabase connection error:', error);
        }
    }
    
    // Bind event listeners
    bindEvents() {
        console.log('🔧 Binding events...');
        
        // Form submission
        const form = document.getElementById('announcementForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                console.log('📝 Form submit event triggered');
                this.handleFormSubmit(e);
            });
            console.log('✅ Form submit event bound');
        } else {
            console.error('❌ Could not find form with id "announcementForm"');
        }
        
        // File upload
        const fileInput = document.getElementById('imageFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            console.log('✅ File input event bound');
        } else {
            console.error('❌ Could not find file input with id "imageFile"');
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetForm());
            console.log('✅ Cancel button event bound');
        } else {
            console.error('❌ Could not find cancel button with id "cancelBtn"');
        }
    }
    
    // Handle form submission
    async handleFormSubmit(e) {
        console.log('🚀 Form submission started');
        e.preventDefault();
        
        if (this.isSubmitting) {
            console.log('⏳ Already submitting, ignoring...');
            return;
        }
        
        try {
            console.log('📋 Processing form data...');
            this.isSubmitting = true;
            this.setSubmitButtonState(true);
            
            const formData = new FormData(e.target);
            console.log('📝 Form data created:', formData);
            
            const announcementData = await this.processFormData(formData);
            console.log('✅ Announcement data processed:', announcementData);
            
            if (this.currentEditId) {
                console.log('🔄 Updating existing announcement:', this.currentEditId);
                await SupabaseHelper.updateAnnouncement(this.currentEditId, announcementData);
                this.showMessage('Announcement updated successfully!', 'success');
            } else {
                console.log('➕ Creating new announcement');
                await SupabaseHelper.createAnnouncement(announcementData);
                this.showMessage('Announcement created successfully!', 'success');
            }
            
            console.log('🧹 Resetting form...');
            this.resetForm();
            console.log('🔄 Reloading announcements...');
            await this.loadAnnouncements();
            
        } catch (error) {
            console.error('❌ Error submitting form:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            console.log('✅ Form submission completed');
        }
    }
    
    // Process form data and handle image upload
    async processFormData(formData) {
        const data = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            details: formData.get('details').trim(),
            layout: formData.get('layout'),
            display_order: parseInt(formData.get('order'))
        };
        
        // Validate required fields
        if (!data.title || !data.description || !data.layout || !data.display_order) {
            throw new Error('Please fill in all required fields');
        }
        
        // Handle image upload
        const imageFile = formData.get('imageFile');
        if (imageFile && imageFile.size > 0) {
            // Validate file type
            if (!imageFile.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            
            // Validate file size (max 5MB)
            if (imageFile.size > 5 * 1024 * 1024) {
                throw new Error('Image file must be less than 5MB');
            }
            
            try {
                const imageResult = await SupabaseHelper.uploadImage(imageFile, imageFile.name);
                data.image_url = imageResult.url;
                data.image_path = imageResult.path;
                
                // If updating, delete old image
                if (this.currentEditId) {
                    const existingAnnouncement = await SupabaseHelper.getAnnouncement(this.currentEditId);
                    if (existingAnnouncement.image_path && existingAnnouncement.image_path !== data.image_path) {
                        await SupabaseHelper.deleteImage(existingAnnouncement.image_path);
                    }
                }
            } catch (error) {
                throw new Error(`Image upload failed: ${error.message}`);
            }
        }
        
        return data;
    }
    
    // Handle file selection and preview
    handleFileSelect(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        const uploadText = document.getElementById('fileUploadText');
        
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showMessage('Please select a valid image file', 'error');
                e.target.value = '';
                return;
            }
            
            // Validate file size
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage('Image file must be less than 5MB', 'error');
                e.target.value = '';
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            uploadText.textContent = `📎 ${file.name}`;
        } else {
            preview.style.display = 'none';
            uploadText.textContent = 'Click to select an image or drag and drop';
        }
    }
    
    // Load and display all announcements
    async loadAnnouncements() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const listContainer = document.getElementById('gridItemsList');
        const countElement = document.getElementById('announcementsCount');
        
        // Check if SupabaseHelper is available
        if (typeof SupabaseHelper === 'undefined') {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (listContainer) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #d32f2f;">
                        <p>Error: Supabase configuration not loaded. Please refresh the page.</p>
                    </div>
                `;
            }
            return;
        }
        
        try {
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            if (listContainer) listContainer.innerHTML = '';
            
            const announcements = await SupabaseHelper.getAnnouncements();
            
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Update count
            if (countElement) countElement.textContent = announcements.length;
            
            if (announcements.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #718096;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                        <h3 style="margin-bottom: 0.5rem; color: #4a5568;">No announcements yet</h3>
                        <p>Create your first announcement using the form on the left!</p>
                    </div>
                `;
                return;
            }
            
            listContainer.innerHTML = '';
            announcements.forEach(announcement => {
                const item = this.createAnnouncementListItem(announcement);
                listContainer.appendChild(item);
            });
            
        } catch (error) {
            console.error('Error loading announcements:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (listContainer) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #e53e3e;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                        <p style="margin-bottom: 1rem;">Error loading announcements: ${error.message}</p>
                        <button onclick="adminPanel.loadAnnouncements()" class="btn btn-primary">🔄 Try Again</button>
                    </div>
                `;
            }
            if (countElement) countElement.textContent = '!';
        }
    }
    
    // Create list item for announcement
    createAnnouncementListItem(announcement) {
        const item = document.createElement('div');
        item.className = 'announcement-item';
        item.setAttribute('data-id', announcement.id);
        
        // Truncate description for preview
        const shortDescription = announcement.description.length > 100 
            ? announcement.description.substring(0, 100) + '...' 
            : announcement.description;
        
        const imageHtml = announcement.image_url ? 
            `<img src="${announcement.image_url}" alt="${announcement.title}" class="announcement-image">` :
            `<div class="announcement-placeholder">📷 No Image</div>`;
        
        item.innerHTML = `
            ${imageHtml}
            <div class="announcement-content">
                <div class="announcement-title">${this.formatText(announcement.title)}</div>
                <div class="announcement-description">${this.formatText(shortDescription)}</div>
                <div class="announcement-meta">
                    <span>📊 Order: ${announcement.display_order}</span>
                    <span>🎨 Layout: ${announcement.layout}</span>
                    <span>📅 ${new Date(announcement.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="announcement-actions">
                <button class="btn-small btn-edit" onclick="adminPanel.editAnnouncement('${announcement.id}')">
                    ✏️ Edit
                </button>
                <button class="btn-small btn-delete" onclick="adminPanel.confirmDelete('${announcement.id}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        return item;
    }
    
    // Edit announcement
    async editAnnouncement(id) {
        try {
            const announcement = await SupabaseHelper.getAnnouncement(id);
            
            // Populate form
            document.getElementById('itemId').value = id;
            document.getElementById('title').value = announcement.title;
            document.getElementById('description').value = announcement.description;
            document.getElementById('details').value = announcement.details || '';
            document.getElementById('layout').value = announcement.layout;
            document.getElementById('order').value = announcement.display_order;
            
            // Show image preview if exists
            const preview = document.getElementById('imagePreview');
            const uploadText = document.getElementById('fileUploadText');
            if (announcement.image_url) {
                preview.src = announcement.image_url;
                preview.style.display = 'block';
                uploadText.textContent = 'Current image (select new file to replace)';
            }
            
            // Update form title and button
            document.getElementById('formTitle').textContent = '✏️ Edit Announcement';
            document.getElementById('submitBtn').innerHTML = '💾 Update Announcement';
            
            this.currentEditId = id;
            
            // Scroll to form
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error loading announcement for edit:', error);
            this.showMessage(`Error loading announcement: ${error.message}`, 'error');
        }
    }
    
    // Confirm delete
    confirmDelete(id) {
        if (confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            this.deleteAnnouncement(id);
        }
    }
    
    // Delete announcement
    async deleteAnnouncement(id) {
        try {
            await SupabaseHelper.deleteAnnouncement(id);
            this.showMessage('Announcement deleted successfully!', 'success');
            await this.loadAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            this.showMessage(`Error deleting announcement: ${error.message}`, 'error');
        }
    }
    
    // Reset form to default state
    resetForm() {
        const form = document.getElementById('announcementForm');
        if (form) form.reset();
        
        this.currentEditId = null;
        
        // Reset form title and button
        document.getElementById('formTitle').textContent = '📝 Add New Announcement';
        document.getElementById('submitBtn').innerHTML = '✨ Add Announcement';
        
        // Hide image preview
        const preview = document.getElementById('imagePreview');
        const uploadText = document.getElementById('fileUploadText');
        if (preview) preview.style.display = 'none';
        if (uploadText) uploadText.textContent = 'Click to select an image or drag and drop';
        
        // Clear messages
        this.clearMessages();
    }
    
    // Set submit button state
    setSubmitButtonState(loading) {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = loading;
            if (loading) {
                submitBtn.innerHTML = '⏳ Saving...';
            } else {
                submitBtn.innerHTML = this.currentEditId ? '💾 Update Announcement' : '✨ Add Announcement';
            }
        }
    }
    
    // Show message to user
    showMessage(message, type = 'success') {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        container.innerHTML = '';
        container.appendChild(messageDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    // Clear all messages
    clearMessages() {
        const container = document.getElementById('messageContainer');
        if (container) container.innerHTML = '';
    }
    
    // Format text with safe HTML - allows anchor tags while preventing XSS
    formatText(text) {
        if (!text) return '';
        
        // Step 1: Extract existing anchor tags and store them safely
        const anchorStore = [];
        let processedText = text;
        
        // Replace existing anchor tags with unique placeholders
        processedText = processedText.replace(/<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, linkText) => {
            // Validate that href is a safe URL
            if (href.match(/^(https?:\/\/|mailto:)/i)) {
                const id = `SAFE_ANCHOR_${anchorStore.length}`;
                anchorStore.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
                return `{{${id}}}`;
            }
            // If not safe, treat as plain text
            return `&lt;a href="${href}"&gt;${linkText}&lt;/a&gt;`;
        });
        
        // Step 2: Escape all remaining HTML
        const div = document.createElement('div');
        div.textContent = processedText;
        let escapedText = div.innerHTML;
        
        // Step 3: Convert plain URLs to links (but not inside our placeholders)
        escapedText = escapedText.replace(/(\s|^|>)(https?:\/\/[^\s<>"'\}]+)/gi, (match, prefix, url) => {
            return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        
        // Step 4: Convert email addresses to mailto links
        escapedText = escapedText.replace(/(\s|^|>)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, (match, prefix, email) => {
            return `${prefix}<a href="mailto:${email}">${email}</a>`;
        });
        
        // Step 5: Restore the safely stored anchor tags
        anchorStore.forEach((anchor, index) => {
            escapedText = escapedText.replace(`{{SAFE_ANCHOR_${index}}}`, anchor);
        });
        
        // Step 6: Convert line breaks to <br> tags
        escapedText = escapedText.replace(/\n/g, '<br>');
        
        return escapedText;
    }
}

// Note: Admin panel initialization is handled in admin.html
// to ensure proper script loading order
