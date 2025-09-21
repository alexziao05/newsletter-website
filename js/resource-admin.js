// Resource Sections Admin Management
class ResourceManager {
    constructor() {
        this.resourceForm = null;
        this.resourceSectionsList = null;
        this.loadingState = null;
        this.isEditing = false;
        this.currentEditId = null;
    }
    
    // Initialize resource manager
    init() {
        console.log('📚 Initializing resource manager...');
        
        this.resourceForm = document.getElementById('resourceForm');
        this.resourceSectionsList = document.getElementById('resourceSectionsList');
        this.loadingState = document.getElementById('resourceLoadingState');
        
        if (!this.resourceForm) {
            console.error('❌ Resource form not found');
            return;
        }
        
        // Set up form submission
        this.resourceForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Set up image preview
        const imageInput = document.getElementById('resourceImage');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.previewImage(e));
        }
        
        // Load initial resource sections
        this.loadResourceSections();
        
        console.log('✅ Resource manager initialized');
    }
    
    // Handle form submission
    async handleSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(this.resourceForm);
            let sectionData = {
                title: formData.get('resourceTitle'),
                description: formData.get('resourceDescription'),
                display_order: parseInt(formData.get('resourceOrder')) || 0
            };
            
            // Validate required fields
            if (!sectionData.title || !sectionData.description) {
                this.showMessage('Please fill in all required fields.', 'error');
                return;
            }
            
            // Handle image upload if provided
            const imageFile = formData.get('resourceImage');
            if (imageFile && imageFile.size > 0) {
                // Validate file type
                if (!imageFile.type.startsWith('image/')) {
                    this.showMessage('Please select a valid image file', 'error');
                    return;
                }
                
                // Validate file size
                if (imageFile.size > 5 * 1024 * 1024) {
                    this.showMessage('Image file must be less than 5MB', 'error');
                    return;
                }
                
                try {
                    const imageUpload = await window.SupabaseHelper.uploadImage(imageFile, imageFile.name);
                    sectionData.image_url = imageUpload.url;
                    sectionData.image_path = imageUpload.path;
                } catch (error) {
                    console.error('Error uploading image:', error);
                    this.showMessage(`Error uploading image: ${error.message}`, 'error');
                    return;
                }
            }
            
            if (this.isEditing && this.currentEditId) {
                // Update existing section
                await window.SupabaseHelper.updateResourceSection(this.currentEditId, sectionData);
                this.showMessage('Resource section updated successfully! 🎉', 'success');
            } else {
                // Create new section
                await window.SupabaseHelper.createResourceSection(sectionData);
                this.showMessage('Resource section added successfully! 🎉', 'success');
            }
            
            // Reset form and reload sections
            this.resetForm();
            await this.loadResourceSections();
            
            // Refresh main page resources if it exists
            if (window.dynamicResources) {
                window.dynamicResources.refresh();
            }
            
        } catch (error) {
            console.error('Error saving resource section:', error);
            this.showMessage(`Error saving resource section: ${error.message}`, 'error');
        }
    }
    
    // Preview uploaded image
    previewImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('resourceImagePreview');
        const uploadText = document.getElementById('resourceFileUploadText');
        
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showMessage('Please select a valid image file', 'error');
                event.target.value = '';
                return;
            }
            
            // Validate file size
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage('Image file must be less than 5MB', 'error');
                event.target.value = '';
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            if (uploadText) {
                uploadText.textContent = `📎 ${file.name}`;
            }
        } else {
            preview.style.display = 'none';
            if (uploadText) {
                uploadText.textContent = 'Click to select an image or drag and drop';
            }
        }
    }
    
    // Load all resource sections
    async loadResourceSections() {
        if (!this.resourceSectionsList || !this.loadingState) return;
        
        try {
            this.loadingState.style.display = 'block';
            this.resourceSectionsList.style.display = 'none';
            
            // Check if Supabase is configured
            if (!window.SupabaseHelper || !window.SupabaseHelper.isConfigured()) {
                this.loadingState.innerHTML = '<p>⚠️ Please configure Supabase to manage resource sections</p>';
                return;
            }
            
            const sections = await window.SupabaseHelper.getResourceSections();
            
            this.loadingState.style.display = 'none';
            this.resourceSectionsList.style.display = 'block';
            
            // Update count
            const countElement = document.getElementById('resourceSectionsCount');
            if (countElement) {
                countElement.textContent = sections.length;
            }
            
            // Render sections
            this.renderResourceSections(sections);
            
        } catch (error) {
            console.error('Error loading resource sections:', error);
            this.loadingState.innerHTML = `<p>❌ Error loading resource sections: ${error.message}</p>`;
        }
    }
    
    // Render resource sections list
    renderResourceSections(sections) {
        if (!this.resourceSectionsList) return;
        
        if (sections.length === 0) {
            this.resourceSectionsList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #718096;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                    <h3 style="margin-bottom: 0.5rem; color: #4a5568;">No resource sections yet</h3>
                    <p>Create your first resource section using the form on the left!</p>
                </div>
            `;
            return;
        }
        
        this.resourceSectionsList.innerHTML = '';
        
        sections.forEach(section => {
            const sectionElement = this.createSectionElement(section);
            this.resourceSectionsList.appendChild(sectionElement);
        });
    }
    
    // Create resource section list item element
    createSectionElement(section) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'announcement-item';
        sectionDiv.setAttribute('data-section-id', section.id);
        
        sectionDiv.innerHTML = `
            ${section.image_url ? 
                `<img src="${section.image_url}" alt="${section.title}" class="announcement-image">` :
                `<div class="announcement-placeholder">📷 No Image</div>`
            }
            <div class="announcement-content">
                <div class="announcement-title">${section.title}</div>
                <div class="announcement-description">
                    ${section.description.length > 100 ? section.description.substring(0, 100) + '...' : section.description}
                </div>
                <div class="announcement-meta">
                    <span>📊 Order: ${section.display_order}</span>
                    <span>📅 ${new Date(section.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="announcement-actions">
                <button class="btn-small btn-edit" onclick="window.resourceManager.editSection('${section.id}')">
                    ✏️ Edit
                </button>
                <button class="btn-small btn-delete" onclick="window.resourceManager.deleteSection('${section.id}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        return sectionDiv;
    }
    
    // Edit resource section
    async editSection(sectionId) {
        try {
            const section = await window.SupabaseHelper.getResourceSection(sectionId);
            
            // Fill form with section data
            document.getElementById('resourceTitle').value = section.title;
            document.getElementById('resourceDescription').value = section.description;
            document.getElementById('resourceOrder').value = section.display_order;
            
            // Show image preview if exists
            if (section.image_url) {
                const previewContainer = document.getElementById('resourceImagePreview');
                if (previewContainer) {
                    previewContainer.innerHTML = `
                        <div class="preview-image">
                            <img src="${section.image_url}" alt="Current image" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                            <p class="preview-filename">Current image</p>
                        </div>
                    `;
                }
            }
            
            // Set editing state
            this.isEditing = true;
            this.currentEditId = sectionId;
            
            // Update form title and button
            const formTitle = document.getElementById('resourceFormTitle');
            if (formTitle) {
                formTitle.textContent = 'Edit Resource Section';
            }
            
            const submitButton = this.resourceForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '💾 Update Section';
            }
            
            // Scroll to form
            this.resourceForm.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error loading resource section for editing:', error);
            this.showMessage(`Error loading resource section: ${error.message}`, 'error');
        }
    }
    
    // Delete resource section
    async deleteSection(sectionId) {
        if (!confirm('Are you sure you want to delete this resource section?')) {
            return;
        }
        
        try {
            await window.SupabaseHelper.deleteResourceSection(sectionId);
            this.showMessage('Resource section deleted successfully! 🗑️', 'success');
            await this.loadResourceSections();
            
            // Refresh main page resources if it exists
            if (window.dynamicResources) {
                window.dynamicResources.refresh();
            }
            
        } catch (error) {
            console.error('Error deleting resource section:', error);
            this.showMessage(`Error deleting resource section: ${error.message}`, 'error');
        }
    }
    
    // Reset form to add mode
    resetForm() {
        if (!this.resourceForm) return;
        
        this.resourceForm.reset();
        this.isEditing = false;
        this.currentEditId = null;
        
        // Clear image preview
        const previewContainer = document.getElementById('resourceImagePreview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        // Reset form title and button
        const formTitle = document.getElementById('resourceFormTitle');
        if (formTitle) {
            formTitle.textContent = 'Add New Resource Section';
        }
        
        const submitButton = this.resourceForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '✨ Add Resource Section';
        }
    }
    
    // Show message to user
    showMessage(message, type = 'info') {
        // Try to use the existing message container
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            // Create a temporary message container
            messageContainer = document.createElement('div');
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
            ${type === 'success' ? 'background: linear-gradient(135deg, #10B981, #059669);' : ''}
            ${type === 'error' ? 'background: linear-gradient(135deg, #EF4444, #DC2626);' : ''}
            ${type === 'info' ? 'background: linear-gradient(135deg, #3B82F6, #1D4ED8);' : ''}
        `;
        messageDiv.textContent = message;
        
        messageContainer.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Export for global use
window.ResourceManager = ResourceManager;
