// Supabase Configuration
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://mqnkwoayeimfomfmsows.supabase.co'; // e.g., 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmt3b2F5ZWltZm9tZm1zb3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjU0NzYsImV4cCI6MjA3MzcwMTQ3Nn0.JiBzjB4Z8xmCizmA4ZZQJ6yBYyEo1NRzbSmRYJlKpEI';

// Check if credentials are configured
const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
let supabase = null;
try {
    if (isConfigured) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️ Supabase credentials not configured. Please update SUPABASE_URL and SUPABASE_ANON_KEY in supabase-config.js');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
}

// Database table names
const TABLES = {
    ANNOUNCEMENTS: 'announcements',
    CALENDAR_EVENTS: 'calendar_events',
    RESOURCE_SECTIONS: 'resource_sections',
    IMAGES: 'announcement_images' // If you want separate image storage
};

// Storage bucket name for images
const STORAGE_BUCKET = 'newsletter-images';

// Supabase helper functions
class SupabaseHelper {
    
    // Check if Supabase is properly configured
    static isConfigured() {
        return isConfigured && supabase !== null;
    }
    
    // Get configuration status
    static getConfigurationStatus() {
        if (!isConfigured) {
            return {
                configured: false,
                message: 'Please update SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase-config.js with your actual Supabase credentials.'
            };
        }
        if (!supabase) {
            return {
                configured: false,
                message: 'Supabase client failed to initialize. Check your credentials and try again.'
            };
        }
        return {
            configured: true,
            message: 'Supabase is properly configured.'
        };
    }
    
    // Test connection to Supabase
    static async testConnection() {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized. Please check your configuration.');
            }
            
            const { data, error } = await supabase.from(TABLES.ANNOUNCEMENTS).select('count', { count: 'exact', head: true });
            if (error) throw error;
            console.log('✅ Supabase connection successful');
            return true;
        } catch (error) {
            console.error('❌ Supabase connection failed:', error);
            return false;
        }
    }
    
    // Get all announcements ordered by display order
    static async getAnnouncements() {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized. Please configure your credentials.');
            }
            
            const { data, error } = await supabase
                .from(TABLES.ANNOUNCEMENTS)
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching announcements:', error);
            throw error;
        }
    }
    
    // Get single announcement by ID
    static async getAnnouncement(id) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ANNOUNCEMENTS)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching announcement:', error);
            throw error;
        }
    }
    
    // Create new announcement
    static async createAnnouncement(announcementData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ANNOUNCEMENTS)
                .insert([announcementData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating announcement:', error);
            throw error;
        }
    }
    
    // Update existing announcement
    static async updateAnnouncement(id, announcementData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ANNOUNCEMENTS)
                .update(announcementData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    }
    
    // Delete announcement
    static async deleteAnnouncement(id) {
        try {
            // First delete the image if it exists
            const announcement = await this.getAnnouncement(id);
            if (announcement.image_url) {
                await this.deleteImage(announcement.image_path);
            }
            
            const { error } = await supabase
                .from(TABLES.ANNOUNCEMENTS)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting announcement:', error);
            throw error;
        }
    }
    
    // Calendar Events Methods
    
    // Get all calendar events ordered by date
    static async getCalendarEvents() {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized. Please configure your credentials.');
            }
            
            const { data, error } = await supabase
                .from(TABLES.CALENDAR_EVENTS)
                .select('*')
                .order('event_date', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    }
    
    // Get single calendar event by ID
    static async getCalendarEvent(id) {
        try {
            const { data, error } = await supabase
                .from(TABLES.CALENDAR_EVENTS)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching calendar event:', error);
            throw error;
        }
    }
    
    // Create new calendar event
    static async createCalendarEvent(eventData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.CALENDAR_EVENTS)
                .insert([eventData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }
    
    // Update existing calendar event
    static async updateCalendarEvent(id, eventData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.CALENDAR_EVENTS)
                .update(eventData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating calendar event:', error);
            throw error;
        }
    }
    
    // Delete calendar event
    static async deleteCalendarEvent(id) {
        try {
            const { error } = await supabase
                .from(TABLES.CALENDAR_EVENTS)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw error;
        }
    }
    
    // Resource Sections Methods
    
    // Get all resource sections ordered by display order
    static async getResourceSections() {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized. Please configure your credentials.');
            }
            
            const { data, error } = await supabase
                .from(TABLES.RESOURCE_SECTIONS)
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching resource sections:', error);
            throw error;
        }
    }
    
    // Get single resource section by ID
    static async getResourceSection(id) {
        try {
            const { data, error } = await supabase
                .from(TABLES.RESOURCE_SECTIONS)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching resource section:', error);
            throw error;
        }
    }
    
    // Create new resource section
    static async createResourceSection(sectionData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.RESOURCE_SECTIONS)
                .insert([sectionData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating resource section:', error);
            throw error;
        }
    }
    
    // Update existing resource section
    static async updateResourceSection(id, sectionData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.RESOURCE_SECTIONS)
                .update(sectionData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating resource section:', error);
            throw error;
        }
    }
    
    // Delete resource section
    static async deleteResourceSection(id) {
        try {
            // First delete the image if it exists
            const section = await this.getResourceSection(id);
            if (section.image_path) {
                await this.deleteImage(section.image_path);
            }
            
            const { error } = await supabase
                .from(TABLES.RESOURCE_SECTIONS)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting resource section:', error);
            throw error;
        }
    }
    
    // Upload image to Supabase storage
    static async uploadImage(file, fileName) {
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}_${fileName}`;
            
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(uniqueFileName);
            
            return {
                path: uniqueFileName,
                url: urlData.publicUrl
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
    
    // Delete image from storage
    static async deleteImage(imagePath) {
        try {
            if (!imagePath) return;
            
            const { error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([imagePath]);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }
    
    // Initialize database tables (run this once to set up)
    static async initializeDatabase() {
        try {
            // This function would typically be run through Supabase SQL editor
            // Here's the SQL you need to run in your Supabase dashboard:
            console.log(`
                -- Run this SQL in your Supabase SQL editor to create the announcements table:
                
                CREATE TABLE announcements (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    details TEXT,
                    image_url TEXT,
                    image_path TEXT,
                    layout TEXT NOT NULL CHECK (layout IN ('normal', 'reverse')),
                    display_order INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
                );
                
                -- Create calendar events table:
                CREATE TABLE calendar_events (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    event_date DATE NOT NULL,
                    link_url TEXT,
                    display_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
                );
                
                -- Create resource sections table:
                CREATE TABLE resource_sections (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    image_url TEXT,
                    image_path TEXT,
                    display_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
                );
                
                -- Create storage bucket for images (or use existing one):
                INSERT INTO storage.buckets (id, name, public) VALUES ('${STORAGE_BUCKET}', '${STORAGE_BUCKET}', true);
                
                -- Enable RLS (Row Level Security) if needed:
                ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
                ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
                ALTER TABLE resource_sections ENABLE ROW LEVEL SECURITY;
                
                -- Create policies to allow public read access:
                CREATE POLICY "Allow public read access" ON announcements FOR SELECT USING (true);
                CREATE POLICY "Allow public read access" ON calendar_events FOR SELECT USING (true);
                CREATE POLICY "Allow public read access" ON resource_sections FOR SELECT USING (true);
                
                -- Create policies for insert/update/delete (adjust based on your auth needs):
                CREATE POLICY "Allow public insert" ON announcements FOR INSERT WITH CHECK (true);
                CREATE POLICY "Allow public update" ON announcements FOR UPDATE USING (true);
                CREATE POLICY "Allow public delete" ON announcements FOR DELETE USING (true);
                
                CREATE POLICY "Allow public insert" ON calendar_events FOR INSERT WITH CHECK (true);
                CREATE POLICY "Allow public update" ON calendar_events FOR UPDATE USING (true);
                CREATE POLICY "Allow public delete" ON calendar_events FOR DELETE USING (true);
                
                CREATE POLICY "Allow public insert" ON resource_sections FOR INSERT WITH CHECK (true);
                CREATE POLICY "Allow public update" ON resource_sections FOR UPDATE USING (true);
                CREATE POLICY "Allow public delete" ON resource_sections FOR DELETE USING (true);
            `);
        } catch (error) {
            console.error('Error in database initialization info:', error);
        }
    }
}

// Export for use in other files
window.SupabaseHelper = SupabaseHelper;
window.supabaseClient = supabase;
