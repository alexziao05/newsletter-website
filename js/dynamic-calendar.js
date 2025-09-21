// Dynamic Calendar Management with Grid View
class DynamicCalendar {
    constructor() {
        this.calendarContainer = null;
        this.staticCalendarItems = null;
        this.isLoaded = false;
        this.currentDate = new Date();
        this.currentEvents = [];
        this.selectedEvent = null;
    }
    
    // Initialize the dynamic calendar
    async init() {
        console.log('🗓️ Initializing dynamic calendar...');
        
        try {
            // Find calendar container
            this.calendarContainer = document.getElementById('dynamic-calendar');
            if (!this.calendarContainer) {
                console.log('⚠️ Calendar container not found, calendar will remain static');
                return;
            }
            
            // Store static content as fallback
            this.staticCalendarItems = this.calendarContainer.querySelector('.static-calendar-items');
            
            // Check if Supabase is configured
            if (!window.SupabaseHelper || !window.SupabaseHelper.isConfigured()) {
                console.log('⚠️ Supabase not configured, showing static calendar');
                this.showStaticCalendar();
                return;
            }
            
            // Test connection
            const connectionOk = await window.SupabaseHelper.testConnection();
            if (!connectionOk) {
                console.log('⚠️ Supabase connection failed, showing static calendar');
                this.showStaticCalendar();
                return;
            }
            
            // Load dynamic calendar events
            await this.loadCalendarEvents();
            this.isLoaded = true;
            console.log('✅ Dynamic calendar loaded successfully');
            
        } catch (error) {
            console.error('❌ Error initializing dynamic calendar:', error);
            this.showStaticCalendar();
        }
    }
    
    // Load calendar events from database
    async loadCalendarEvents() {
        try {
            const events = await window.SupabaseHelper.getCalendarEvents();
            console.log(`📅 Loaded ${events.length} calendar events`);
            
            if (events.length === 0) {
                console.log('📅 No calendar events found in database - hiding calendar section');
                this.hideCalendarSection();
                return;
            }
            
            this.currentEvents = events;
            this.renderCalendarGrid();
            this.showCalendarSection();
            
        } catch (error) {
            console.error('❌ Error loading calendar events:', error);
            console.log('📅 Database error - hiding calendar section');
            this.hideCalendarSection();
        }
    }
    
    // Show calendar section
    showCalendarSection() {
        const calendarSection = document.getElementById('calendar-section');
        if (calendarSection) {
            calendarSection.style.display = 'block';
        }
        if (this.calendarContainer) {
            this.calendarContainer.style.display = 'block';
        }
    }
    
    // Hide calendar section completely when no data
    hideCalendarSection() {
        const calendarSection = document.getElementById('calendar-section');
        if (calendarSection) {
            calendarSection.style.display = 'none';
        }
        if (this.calendarContainer) {
            this.calendarContainer.style.display = 'none';
        }
        console.log('📅 Calendar section hidden (no data)');
    }
    
    // Render full calendar grid
    renderCalendarGrid() {
        if (!this.calendarContainer) return;
        
        // Hide static content
        if (this.staticCalendarItems) {
            this.staticCalendarItems.style.display = 'none';
        }
        
        const calendarHTML = this.generateCalendarHTML();
        this.calendarContainer.innerHTML = calendarHTML;
        
        console.log('📅 Calendar grid rendered');
    }
    
    // Generate calendar HTML
    generateCalendarHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Month names
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        let html = `
            <div class="calendar-widget">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" onclick="window.dynamicCalendar.previousMonth()">&lt;</button>
                    <h3 class="calendar-title">${monthNames[month]} ${year}</h3>
                    <button class="calendar-nav-btn" onclick="window.dynamicCalendar.nextMonth()">&gt;</button>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-days-header">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
                    </div>
                    <div class="calendar-days">
        `;
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateString = currentDate.toISOString().split('T')[0];
            const isToday = this.isSameDate(currentDate, today);
            const dayEvents = this.getEventsForDate(dateString);
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (dayEvents.length > 0) dayClass += ' has-events';
            
            html += `
                <div class="${dayClass}" data-date="${dateString}">
                    <div class="calendar-day-number">${day}</div>
                    ${dayEvents.length > 0 ? `<div class="calendar-events-indicator">${dayEvents.length}</div>` : ''}
                    <div class="calendar-day-events">
                        ${dayEvents.map(event => `
                            <div class="calendar-event" onclick="window.dynamicCalendar.showEventPopup('${event.id}')" title="${event.title}">
                                ${event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `
                    </div>
                </div>
            </div>
            
            <!-- Event Popup Modal -->
            <div id="event-popup" class="event-popup-overlay" onclick="window.dynamicCalendar.closeEventPopup()">
                <div class="event-popup" onclick="event.stopPropagation()">
                    <div class="event-popup-header">
                        <h3 id="popup-event-title"></h3>
                        <button class="popup-close-btn" onclick="window.dynamicCalendar.closeEventPopup()">&times;</button>
                    </div>
                    <div class="event-popup-content">
                        <div class="popup-event-date">
                            <strong>📅 Date:</strong> <span id="popup-event-date"></span>
                        </div>
                        <div class="popup-event-description">
                            <strong>📄 Description:</strong>
                            <p id="popup-event-description"></p>
                        </div>
                        <div id="popup-event-link" class="popup-event-link" style="display: none;">
                            <strong>🔗 Link:</strong> <a id="popup-event-link-url" href="#" target="_blank"></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Get events for a specific date
    getEventsForDate(dateString) {
        return this.currentEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            const eventDateString = eventDate.toISOString().split('T')[0];
            return eventDateString === dateString;
        });
    }
    
    // Check if two dates are the same day
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Navigate to previous month
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendarGrid();
    }
    
    // Navigate to next month
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendarGrid();
    }
    
    // Show event popup
    showEventPopup(eventId) {
        const event = this.currentEvents.find(e => e.id === eventId);
        if (!event) return;
        
        this.selectedEvent = event;
        
        // Populate popup content
        document.getElementById('popup-event-title').textContent = event.title;
        document.getElementById('popup-event-description').innerHTML = this.formatText(event.description);
        
        // Format date
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('popup-event-date').textContent = formattedDate;
        
        // Show link if available
        const linkElement = document.getElementById('popup-event-link');
        const linkUrl = document.getElementById('popup-event-link-url');
        if (event.link_url) {
            linkUrl.href = event.link_url;
            linkUrl.textContent = event.link_url;
            linkElement.style.display = 'block';
        } else {
            linkElement.style.display = 'none';
        }
        
        // Show popup
        document.getElementById('event-popup').style.display = 'flex';
    }
    
    // Close event popup
    closeEventPopup() {
        document.getElementById('event-popup').style.display = 'none';
        this.selectedEvent = null;
    }
    
    // Show static calendar as fallback
    showStaticCalendar() {
        if (this.staticCalendarItems) {
            this.staticCalendarItems.style.display = 'block';
        }
        console.log('📅 Showing static calendar fallback');
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
    
    // Refresh calendar (called from admin after changes)
    async refresh() {
        console.log('🔄 Refreshing calendar...');
        if (this.isLoaded) {
            await this.loadCalendarEvents();
        }
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dynamicCalendar = new DynamicCalendar();
    window.dynamicCalendar.init();
});
