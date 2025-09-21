# SDSU Newsletter Dynamic Grid Setup Guide

## Overview
You now have a dynamic, interactive grid system for your SDSU newsletter! This system allows you to:
- Add, edit, and delete announcements through an admin interface
- Upload images directly to Supabase storage
- Automatically update the main newsletter page
- Maintain your existing design and layout

## Files Added
- `admin.html` - Admin interface for managing announcements
- `js/supabase-config.js` - Supabase connection configuration
- `js/dynamic-grid.js` - Dynamic grid rendering system
- `js/admin.js` - Admin panel functionality

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your Project URL and Public Anon Key
4. Open `js/supabase-config.js` and replace:
   - `YOUR_SUPABASE_URL` with your Project URL
   - `YOUR_SUPABASE_ANON_KEY` with your Public Anon Key

### 2. Database Setup
1. In your Supabase dashboard, go to the SQL Editor
2. Run this SQL to create the announcements table:

**Note**: If you get errors about existing buckets or policies, that's normal - just continue with the setup!

```sql
-- Create announcements table
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

-- Create storage bucket for images (skip if bucket already exists)
-- Option 1: Use existing bucket by updating the config
-- If you get "duplicate key" error, the bucket already exists - that's fine!
INSERT INTO storage.buckets (id, name, public) 
VALUES ('newsletter-images', 'newsletter-images', true)
ON CONFLICT (id) DO NOTHING;

-- Alternative: If you want to use your existing bucket, 
-- update STORAGE_BUCKET in js/supabase-config.js to match your existing bucket name

-- Enable RLS (Row Level Security)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- Note: If policies already exist, you may get "already exists" errors - that's okay!
CREATE POLICY "Allow public read access" ON announcements FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON announcements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON announcements FOR DELETE USING (true);

-- Create storage policies for images
-- These may also give "already exists" errors if you have existing policies
CREATE POLICY "Allow public read access to images" ON storage.objects FOR SELECT USING (bucket_id = 'newsletter-images');
CREATE POLICY "Allow public insert to images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'newsletter-images');
CREATE POLICY "Allow public delete from images" ON storage.objects FOR DELETE USING (bucket_id = 'newsletter-images');
```

**Alternative Setup for Existing Buckets:**
If you prefer to use your existing image bucket:
1. Go to Storage in your Supabase dashboard
2. Note the name of your existing bucket
3. Open `js/supabase-config.js`
4. Change `STORAGE_BUCKET = 'newsletter-images'` to match your bucket name

### 3. Usage

#### Adding New Announcements
1. Open `admin.html` in your browser
2. Fill out the form with:
   - Title: Announcement headline
   - Description: Main announcement text
   - Details: Additional info (dates, locations, links)
   - Layout: Choose image position (left or right)
   - Image: Upload an image file
   - Display Order: Number to control ordering (1, 2, 3...)
3. Click "Add Announcement"

#### Editing Announcements
1. In the admin panel, click "Edit" on any announcement
2. Modify the fields as needed
3. Click "Update Announcement"

#### Deleting Announcements
1. Click "Delete" on any announcement
2. Confirm the deletion

### 4. How It Works

#### Main Page (`index.html`)
- Automatically loads announcements from Supabase when the page loads
- Falls back to static content if Supabase is unavailable
- Displays announcements in the same grid format you're used to

#### Admin Panel (`admin.html`)
- Provides forms for managing announcements
- Handles image uploads to Supabase storage
- Shows a preview of all current announcements

### 5. Features

#### Dynamic Grid System
- Automatically alternates between normal and reverse layouts
- Handles image loading with error fallbacks
- Responsive design that matches your existing styles
- Loading states and error handling

#### Image Management
- Automatic image upload to Supabase storage
- Image compression and optimization
- Automatic cleanup when announcements are deleted
- Support for common image formats (PNG, JPG, WebP)

#### Content Management
- Rich text support (automatically converts URLs to links)
- HTML formatting in descriptions and details
- Order-based display control
- Real-time updates

### 6. Security Considerations
The current setup uses public access policies for simplicity. For production, consider:
- Adding authentication for admin access
- Restricting database policies to authenticated users
- Adding rate limiting for API calls
- Implementing proper CORS settings

### 7. Customization
You can customize the system by:
- Modifying CSS classes in `styles.css`
- Adjusting field validation in `js/admin.js`
- Adding new fields to the database table
- Changing image upload settings in `js/supabase-config.js`

### 8. Troubleshooting

#### Common Issues
1. **"Supabase not connected"**: Check your URL and API key in `supabase-config.js`
2. **"duplicate key value violates unique constraint"**: The bucket already exists - that's fine! You can either:
   - Skip the bucket creation and use your existing bucket
   - Update `STORAGE_BUCKET` in `js/supabase-config.js` to match your existing bucket name
3. **"policy already exists" errors**: Normal if you've run the SQL before - policies are already set up
4. **Images not uploading**: Verify the storage bucket has proper policies and is public
5. **Grid not loading**: Check browser console for JavaScript errors
6. **Static content showing**: Normal fallback behavior when Supabase is unavailable

#### Debug Mode
Open browser console (F12) to see detailed logs and error messages.

### 9. Next Steps
- Add your Supabase credentials to `js/supabase-config.js`
- Run the SQL setup in your Supabase dashboard
- Test the admin panel at `admin.html`
- Start adding your announcements!

## Support
If you encounter issues, check the browser console for error messages and verify your Supabase setup.
