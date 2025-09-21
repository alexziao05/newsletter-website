// Calendar Admin Management
class CalendarManager {
    constructor() {
        this.calendarForm = null;
        this.calendarEventsList = null;
        this.loadingState = null;
        this.isEditing = false;
        this.currentEditId = null;
    }
    
    // Initialize calendar manager
    init() {
        console.log('📅 Initializing calendar manager...');
        
        this.calendarForm = document.getElementById('calendarForm');
        this.calendarEventsList = document.getElementById('calendarEventsList');
        this.loadingState = document.getElementById('calendarLoadingState');
        
        if (!this.calendarForm) {
            console.error('❌ Calendar form not found');
            return;
        }
        
        // Set up form submission
        this.calendarForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Load initial calendar events
        this.loadCalendarEvents();
        
        console.log('✅ Calendar manager initialized');
    }
    
    // Handle form submission
    async handleSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(this.calendarForm);
            const eventData = {
                title: formData.get('eventTitle'),
                description: formData.get('eventDescription'),
                event_date: formData.get('eventDate'),
                link_url: formData.get('eventLink') || null,
                display_order: 0 // Will be set properly based on date
            };
            
            // Validate required fields
            if (!eventData.title || !eventData.description || !eventData.event_date) {
                this.showMessage('Please fill in all required fields.', 'error');
                return;
            }
            
            // Set display order based on date (convert to Unix timestamp in seconds)
            eventData.display_order = Math.floor(new Date(eventData.event_date).getTime() / 1000);
            
            if (this.isEditing && this.currentEditId) {
                // Update existing event
                await window.SupabaseHelper.updateCalendarEvent(this.currentEditId, eventData);
                this.showMessage('Calendar event updated successfully! 🎉', 'success');
            } else {
                // Create new event
                await window.SupabaseHelper.createCalendarEvent(eventData);
                this.showMessage('Calendar event added successfully! 🎉', 'success');
            }
            
            // Reset form and reload events
            this.resetForm();
            await this.loadCalendarEvents();
            
            // Refresh main page calendar if it exists
            if (window.dynamicCalendar) {
                window.dynamicCalendar.refresh();
            }
            
        } catch (error) {
            console.error('Error saving calendar event:', error);
            this.showMessage(`Error saving calendar event: ${error.message}`, 'error');
        }
    }
    
    // Load all calendar events
    async loadCalendarEvents() {
        if (!this.calendarEventsList || !this.loadingState) return;
        
        try {
            this.loadingState.style.display = 'block';
            this.calendarEventsList.style.display = 'none';
            
            // Check if Supabase is configured
            if (!window.SupabaseHelper || !window.SupabaseHelper.isConfigured()) {
                this.loadingState.innerHTML = '<p>⚠️ Please configure Supabase to manage calendar events</p>';
                return;
            }
            
            const events = await window.SupabaseHelper.getCalendarEvents();
            
            this.loadingState.style.display = 'none';
            this.calendarEventsList.style.display = 'block';
            
            // Update count
            const countElement = document.getElementById('calendarEventsCount');
            if (countElement) {
                countElement.textContent = events.length;
            }
            
            // Render events
            this.renderCalendarEvents(events);
            
        } catch (error) {
            console.error('Error loading calendar events:', error);
            this.loadingState.innerHTML = `<p>❌ Error loading calendar events: ${error.message}</p>`;
        }
    }
    
    // Render calendar events list
    renderCalendarEvents(events) {
        if (!this.calendarEventsList) return;
        
        if (events.length === 0) {
            this.calendarEventsList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #718096;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                    <h3 style="margin-bottom: 0.5rem; color: #4a5568;">No calendar events yet</h3>
                    <p>Create your first calendar event using the form on the left!</p>
                </div>
            `;
            return;
        }
        
        this.calendarEventsList.innerHTML = '';
        
        events.forEach(event => {
            const eventElement = this.createEventElement(event);
            this.calendarEventsList.appendChild(eventElement);
        });
    }
    
    // Create calendar event list item element
    createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'announcement-item';
        eventDiv.setAttribute('data-event-id', event.id);
        
        // Format the date
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
        
        eventDiv.innerHTML = `
            <div class="announcement-content">
                <div class="announcement-title">${event.title}</div>
                <div class="announcement-description">
                    ${this.formatText(event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description)}
                </div>
                <div class="announcement-meta">
                    <span>📅 ${formattedDate}</span>
                    ${event.link_url ? `<span>🔗 <a href="${event.link_url}" target="_blank" style="color: #C41230;">Link</a></span>` : ''}
                </div>
            </div>
            <div class="announcement-actions">
                <button class="btn-small btn-edit" onclick="window.calendarManager.editEvent('${event.id}')">
                    ✏️ Edit
                </button>
                <button class="btn-small btn-delete" onclick="window.calendarManager.deleteEvent('${event.id}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        return eventDiv;
    }
    
    // Edit calendar event
    async editEvent(eventId) {
        try {
            const event = await window.SupabaseHelper.getCalendarEvent(eventId);
            
            // Fill form with event data
            document.getElementById('eventDate').value = event.event_date;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description;
            document.getElementById('eventLink').value = event.link_url || '';
            
            // Set editing state
            this.isEditing = true;
            this.currentEditId = eventId;
            
            // Update form title and button
            const formTitle = document.getElementById('calendarFormTitle');
            if (formTitle) {
                formTitle.textContent = 'Edit Calendar Event';
            }
            
            const submitButton = this.calendarForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '💾 Update Event';
            }
            
            // Scroll to form
            this.calendarForm.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error loading calendar event for editing:', error);
            this.showMessage(`Error loading calendar event: ${error.message}`, 'error');
        }
    }
    
    // Delete calendar event
    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this calendar event?')) {
            return;
        }
        
        try {
            await window.SupabaseHelper.deleteCalendarEvent(eventId);
            this.showMessage('Calendar event deleted successfully! 🗑️', 'success');
            await this.loadCalendarEvents();
            
            // Refresh main page calendar if it exists
            if (window.dynamicCalendar) {
                window.dynamicCalendar.refresh();
            }
            
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            this.showMessage(`Error deleting calendar event: ${error.message}`, 'error');
        }
    }
    
    // Reset form to add mode
    resetForm() {
        if (!this.calendarForm) return;
        
        this.calendarForm.reset();
        this.isEditing = false;
        this.currentEditId = null;
        
        // Reset form title and button
        const formTitle = document.getElementById('calendarFormTitle');
        if (formTitle) {
            formTitle.textContent = 'Add New Calendar Event';
        }
        
        const submitButton = this.calendarForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '✨ Add Calendar Event';
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
}

// Export for global use
window.CalendarManager = CalendarManager;
