-- Seed portfolio data

-- Insert profile data
INSERT INTO profile (id, name, title, bio, email, location, linkedin, profile_picture_url, resume_url, cv_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'John Doe',
  'Full Stack Developer',
  'I am a passionate developer who loves creating beautiful and functional web applications. With expertise in modern web technologies, I build scalable solutions that make a difference.',
  'john@example.com',
  'San Francisco, CA',
  'https://linkedin.com/in/johndoe',
  '/images/profile.jpg',
  '/files/resume.pdf',
  '/files/cv.pdf'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  bio = EXCLUDED.bio,
  email = EXCLUDED.email;

-- Insert frontend skills
INSERT INTO skills (name, category, icon, description, proficiency_level, sort_order) VALUES
('React', 'frontend', 'react', 'Building modern user interfaces with React hooks and components', 'expert', 1),
('Next.js', 'frontend', 'nextjs', 'Full-stack React framework for production applications', 'expert', 2),
('TypeScript', 'frontend', 'typescript', 'Type-safe JavaScript for scalable applications', 'experienced', 3),
('Tailwind CSS', 'frontend', 'tailwind', 'Utility-first CSS framework for rapid UI development', 'expert', 4),
('Vue.js', 'frontend', 'vue', 'Progressive JavaScript framework for building UIs', 'experienced', 5),
('HTML5', 'frontend', 'html', 'Semantic markup and modern HTML features', 'expert', 6),
('CSS3', 'frontend', 'css', 'Modern CSS including Grid, Flexbox, and animations', 'expert', 7),
('JavaScript', 'frontend', 'javascript', 'ES6+ JavaScript for dynamic web applications', 'expert', 8)
ON CONFLICT DO NOTHING;

-- Insert backend skills
INSERT INTO skills (name, category, icon, description, proficiency_level, sort_order) VALUES
('Node.js', 'backend', 'nodejs', 'Server-side JavaScript runtime environment', 'expert', 9),
('Python', 'backend', 'python', 'Versatile programming language for backend and scripts', 'experienced', 10),
('PostgreSQL', 'backend', 'postgresql', 'Advanced relational database management', 'experienced', 11),
('MongoDB', 'backend', 'mongodb', 'NoSQL database for flexible data storage', 'experienced', 12),
('GraphQL', 'backend', 'graphql', 'Query language for APIs', 'intermediate', 13),
('Docker', 'backend', 'docker', 'Containerization for consistent deployments', 'experienced', 14),
('AWS', 'backend', 'aws', 'Cloud services and infrastructure', 'intermediate', 15),
('Redis', 'backend', 'redis', 'In-memory data structure store for caching', 'intermediate', 16)
ON CONFLICT DO NOTHING;

-- Insert projects
INSERT INTO projects (title, description, tags, live_url, github_url, image_url, type, featured, sort_order) VALUES
('E-Commerce Platform', 'A full-featured online shopping platform with cart and checkout functionality, user authentication, and admin dashboard.', ARRAY['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL'], 'https://example.com', 'https://github.com', '/images/project1.jpg', 'Web App', true, 1),
('Task Management App', 'Collaborative project management tool with real-time updates, drag-and-drop functionality, and team collaboration features.', ARRAY['React', 'Node.js', 'Socket.io', 'MongoDB'], 'https://example.com', 'https://github.com', '/images/project2.jpg', 'Web App', true, 2),
('AI Chat Application', 'Intelligent chatbot powered by machine learning using natural language processing for intelligent responses.', ARRAY['Python', 'TensorFlow', 'React', 'FastAPI'], 'https://example.com', 'https://github.com', '/images/project3.jpg', 'AI/ML', true, 3),
('Portfolio Website', 'Modern developer portfolio featuring smooth animations, dark/light mode, and fully responsive design.', ARRAY['Next.js', 'Tailwind CSS', 'Framer Motion'], 'https://example.com', 'https://github.com', '/images/project4.jpg', 'Website', false, 4)
ON CONFLICT DO NOTHING;

-- Insert certificates
INSERT INTO certificates (title, issuer, date, description, category, certificate_url, featured, sort_order) VALUES
('AWS Solutions Architect', 'Amazon Web Services', '2024-01-15', 'Professional certification for designing distributed systems on AWS', 'Cloud', 'https://aws.amazon.com/certification', true, 1),
('Google Cloud Professional', 'Google Cloud', '2023-08-20', 'Professional certification for GCP cloud architecture and development', 'Cloud', 'https://cloud.google.com/certification', true, 2),
('Meta Frontend Developer', 'Meta', '2023-05-10', 'Professional certificate in modern frontend development practices', 'Development', 'https://www.coursera.org/meta', true, 3)
ON CONFLICT DO NOTHING;

-- Insert work experience
INSERT INTO work_experience (title, role, period, description, sort_order) VALUES
('Tech Innovators Inc', 'Senior Full Stack Developer', '2022 - Present', 'Leading development of enterprise-scale applications, mentoring junior developers, and architecting scalable solutions using React, Node.js, AWS, and PostgreSQL.', 1),
('Digital Solutions Co', 'Full Stack Developer', '2020 - 2021', 'Developed and maintained multiple client projects, implemented CI/CD pipelines, and improved application performance by 40% using Vue.js, Python, Docker, and MongoDB.', 2),
('StartupXYZ', 'Junior Developer', '2018 - 2020', 'Built features for the core product, collaborated with design team, and participated in agile development processes using JavaScript, React, Node.js, and MySQL.', 3)
ON CONFLICT DO NOTHING;
