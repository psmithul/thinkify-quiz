-- Create companies table for tier-based company management
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 5),
  industry TEXT NOT NULL,
  location TEXT NOT NULL,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster tier-based queries
CREATE INDEX IF NOT EXISTS idx_companies_tier ON companies(tier);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to companies
CREATE POLICY "Anyone can view companies" ON companies
  FOR SELECT USING (true);

-- Only admins can manage companies
CREATE POLICY "Only admins can manage companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add some sample companies
INSERT INTO companies (name, tier, industry, location, website, description, logo_url) VALUES
  ('Google', 5, 'Technology', 'Mountain View, CA', 'https://google.com', 'Leading technology company specializing in search, cloud computing, and AI.', 'https://logo.clearbit.com/google.com'),
  ('Microsoft', 5, 'Technology', 'Redmond, WA', 'https://microsoft.com', 'Global technology corporation known for software, cloud services, and productivity tools.', 'https://logo.clearbit.com/microsoft.com'),
  ('Apple', 5, 'Technology', 'Cupertino, CA', 'https://apple.com', 'Consumer electronics and software company known for innovative products.', 'https://logo.clearbit.com/apple.com'),
  ('Amazon', 5, 'Technology', 'Seattle, WA', 'https://amazon.com', 'E-commerce and cloud computing giant with diverse technology services.', 'https://logo.clearbit.com/amazon.com'),
  ('Meta', 4, 'Technology', 'Menlo Park, CA', 'https://meta.com', 'Social media and virtual reality technology company.', 'https://logo.clearbit.com/meta.com'),
  ('Netflix', 4, 'Technology', 'Los Gatos, CA', 'https://netflix.com', 'Streaming entertainment service with global reach.', 'https://logo.clearbit.com/netflix.com'),
  ('Spotify', 4, 'Technology', 'Stockholm, Sweden', 'https://spotify.com', 'Audio streaming and media services provider.', 'https://logo.clearbit.com/spotify.com'),
  ('Airbnb', 4, 'Technology', 'San Francisco, CA', 'https://airbnb.com', 'Online marketplace for lodging and tourism experiences.', 'https://logo.clearbit.com/airbnb.com'),
  ('Uber', 3, 'Technology', 'San Francisco, CA', 'https://uber.com', 'Ride-sharing and food delivery platform.', 'https://logo.clearbit.com/uber.com'),
  ('Lyft', 3, 'Technology', 'San Francisco, CA', 'https://lyft.com', 'Transportation network company offering ride-sharing services.', 'https://logo.clearbit.com/lyft.com'),
  ('Dropbox', 3, 'Technology', 'San Francisco, CA', 'https://dropbox.com', 'Cloud storage and file synchronization service.', 'https://logo.clearbit.com/dropbox.com'),
  ('Slack', 3, 'Technology', 'San Francisco, CA', 'https://slack.com', 'Business communication platform and collaboration hub.', 'https://logo.clearbit.com/slack.com'),
  ('Shopify', 2, 'Technology', 'Ottawa, Canada', 'https://shopify.com', 'E-commerce platform for online stores and retail point-of-sale systems.', 'https://logo.clearbit.com/shopify.com'),
  ('Square', 2, 'Technology', 'San Francisco, CA', 'https://squareup.com', 'Financial services and mobile payment company.', 'https://logo.clearbit.com/squareup.com'),
  ('Zoom', 2, 'Technology', 'San Jose, CA', 'https://zoom.us', 'Video communications platform for remote work and collaboration.', 'https://logo.clearbit.com/zoom.us'),
  ('DocuSign', 2, 'Technology', 'San Francisco, CA', 'https://docusign.com', 'Electronic signature and digital transaction management platform.', 'https://logo.clearbit.com/docusign.com'),
  ('Mailchimp', 1, 'Technology', 'Atlanta, GA', 'https://mailchimp.com', 'Email marketing and automation platform for small businesses.', 'https://logo.clearbit.com/mailchimp.com'),
  ('Canva', 1, 'Technology', 'Sydney, Australia', 'https://canva.com', 'Graphic design platform for creating visual content.', 'https://logo.clearbit.com/canva.com'),
  ('Notion', 1, 'Technology', 'San Francisco, CA', 'https://notion.so', 'Productivity and note-taking application with collaboration features.', 'https://logo.clearbit.com/notion.so'),
  ('Figma', 1, 'Technology', 'San Francisco, CA', 'https://figma.com', 'Collaborative interface design tool for teams.', 'https://logo.clearbit.com/figma.com')
ON CONFLICT (name) DO NOTHING; 