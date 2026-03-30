-- Update portfolio with actual data from lib/data.ts

-- Clear existing data and insert actual profile
DELETE FROM profile WHERE id = '00000000-0000-0000-0000-000000000001';
INSERT INTO profile (id, name, title, bio, email, location, linkedin, profile_picture_url, resume_url, cv_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clarence P. Espanol',
  'Full Stack Developer',
  'I am an aspiring Full Stack Developer with hands-on experience in both front-end and back-end development. From Labo, Camarines Norte, I contribute to building and optimizing projects that focus on functionality, usability, and enhancing the overall user experience. I also assist with documentation, IoT hardware design, and research-related tasks. My core skills include front-end web technologies, technical writing, prototyping, UI/UX design, and providing support for hardware integration.',
  'clarence.espanol0123@gmail.com',
  'Labo, Camarines Norte',
  'https://www.linkedin.com/in/clarence-espanol',
  '/images/profile.jpg',
  '/resume.pdf',
  '/cv.pdf'
);

-- Clear and insert skills
DELETE FROM skills;

-- Frontend skills
INSERT INTO skills (name, category, icon, description, proficiency_level, sort_order) VALUES
('HTML', 'frontend', 'html', 'Semantic markup, accessibility, SEO-friendly structures', 'expert', 1),
('CSS', 'frontend', 'css', 'Flexbox, Grid, animations, responsive design', 'expert', 2),
('JavaScript', 'frontend', 'javascript', 'ES6+, DOM manipulation, async programming', 'experienced', 3),
('React', 'frontend', 'react', 'Building modern user interfaces with React hooks and components', 'experienced', 4),
('Next.js', 'frontend', 'nextjs', 'Full-stack React framework for production applications', 'intermediate', 5),
('TypeScript', 'frontend', 'typescript', 'Type-safe JavaScript for scalable applications', 'intermediate', 6),
('Tailwind CSS', 'frontend', 'tailwind', 'Utility-first CSS framework for rapid UI development', 'experienced', 7),
('UI/UX Design', 'frontend', 'design', 'Figma, user research, wireframing, prototyping', 'experienced', 8);

-- Backend skills
INSERT INTO skills (name, category, icon, description, proficiency_level, sort_order) VALUES
('Node.js', 'backend', 'nodejs', 'Server-side JavaScript runtime environment', 'intermediate', 9),
('PHP', 'backend', 'php', 'Backend logic, MySQL integration, Laravel basics', 'intermediate', 10),
('Python', 'backend', 'python', 'Scripting, data processing, automation', 'intermediate', 11),
('Database Integration', 'backend', 'database', 'MySQL, PostgreSQL, MongoDB basics', 'intermediate', 12),
('Java', 'backend', 'java', 'OOP concepts, basic applications', 'beginner', 13),
('C++', 'backend', 'cpp', 'Fundamentals, algorithms, data structures', 'beginner', 14),
('WordPress', 'backend', 'wordpress', 'WooCommerce, theme customization, plugins', 'experienced', 15),
('VB.NET', 'backend', 'code', 'Windows Forms, desktop applications', 'intermediate', 16);

-- Clear and insert projects
DELETE FROM projects;
INSERT INTO projects (title, description, tags, live_url, type, featured, sort_order) VALUES
('JBC E-Commerce Website', 'Built a full-stack e-commerce website using Firebase for backend and hosting. Features include user authentication, product catalog, and cart system.', ARRAY['Firebase', 'Full-Stack', 'E-Commerce'], '#', 'Full-Stack Development', true, 1),
('WordPress Drugstore E-Commerce', 'Developed a WordPress-powered e-commerce website for a cosmetics/drugstore business. Includes product categories, checkout flow, and responsive design.', ARRAY['WordPress', 'E-Commerce', 'Responsive'], '#', 'WordPress Development', true, 2),
('Bantay Tubig Web App', 'Contributed frontend design and prototyping for a water quality monitoring system. The app tracks, analyzes, and visualizes water data, supporting real-time monitoring. Capstone Project.', ARRAY['Frontend', 'IoT', 'Data Visualization', 'Capstone'], '#', 'Frontend & IoT', true, 3),
('Bayani Brew Prototype Website', 'A simple prototype website built using HTML and CSS. Showcases the brand and layout design for a local coffee brand.', ARRAY['HTML', 'CSS', 'Prototype'], '#', 'Prototype Design', false, 4),
('47th OLLCF Founding Anniversary', 'A static website built using HTML and CSS highlighting the 47th OLLCF Founding Anniversary events. Focused on event highlights and information.', ARRAY['HTML', 'CSS', 'Static Site'], '#', 'Static Website', false, 5);

-- Clear and insert certificates
DELETE FROM certificates;
INSERT INTO certificates (title, issuer, date, description, category, featured, sort_order) VALUES
('Google UX Design Professional Certificate', 'Coursera / Google', 'Dec 14, 2025', 'Completed the online, non-credit Google UX Design Professional Certificate including 7 courses.', 'Design', true, 1),
('Google Project Management Professional Certificate', 'Coursera / Google', 'Dec 15, 2025', 'Completed the online, non-credit Google Project Management Professional Certificate including 7 courses.', 'Management', true, 2),
('Google Data Analytics Professional Certificate', 'Coursera / Google', 'Dec 16, 2025', 'Completed the online, non-credit Google Data Analytics Professional Certificate including 9 courses.', 'Analytics', true, 3),
('Python Essentials 1', 'Cisco Networking Academy / DICT-ITU DTC Initiative', 'Nov 05, 2025', 'Completed the online Python Essentials 1 course through Cisco Networking Academy.', 'Programming', true, 4),
('JavaScript Essentials 1', 'Cisco Networking Academy / DICT-ITU DTC Initiative', 'Nov 24, 2025', 'Completed the online JavaScript Essentials 1 course through Cisco Networking Academy.', 'Programming', true, 5),
('AI Learning ASEAN', 'ASEAN Foundation / Google.org', 'Nov 1, 2025', 'Completed the 12-hour AI learning modules through ASEAN Foundation, demonstrating skills in artificial intelligence.', 'AI', true, 6),
('Installing and Configuring Computer Systems', 'TESDA - NITESD', 'March 30, 2023', 'Completed TESDA Online Program course covering installation and configuration of computer systems.', 'Technical', false, 7),
('Introduction to CSS', 'TESDA - NITESD', 'March 23, 2023', 'Completed TESDA Online Program course introducing CSS, focusing on styling and responsive design.', 'Programming', false, 8),
('Maintaining Computer Systems and Networks', 'TESDA - NITESD', 'May 11, 2023', 'Completed TESDA Online Program course on maintaining computer systems and networks.', 'Technical', false, 9),
('Setting Up Computer Networks', 'TESDA - NITESD', 'May 11, 2023', 'Completed TESDA Online Program course covering setup of computer networks.', 'Technical', false, 10),
('Setting Up Computer Servers', 'TESDA - NITESD', 'May 11, 2023', 'Completed TESDA Online Program course on setting up computer servers.', 'Technical', false, 11),
('CyberCrime Prevention', 'DICT', 'May 20, 2024', 'Cybercrime prevention course covering security measures and legal frameworks to protect digital assets.', 'Security', false, 12),
('PC Hardware Installation', 'ILCDB', 'October 27-29, 2022', 'PC hardware installation course covering assembling and setting up computer components.', 'Technical', false, 13),
('The Road to Digitalization Leads Through Cybersecurity', 'ILCDB', 'October 28, 2022', 'Course on cybersecurity practices for digitalization including encryption and access controls.', 'Security', false, 14),
('The Role of AI in Education', 'DICT Region V', 'May 27, 2025', 'Course on AI applications in education for personalized learning and administrative automation.', 'AI', false, 15),
('Use of Blockchain', 'DICT Region IV-A', 'June 19, 2024', 'Course on blockchain technology applications in finance, supply chains, and digital contracts.', 'Technology', false, 16);

-- Clear and insert work experience
DELETE FROM work_experience;
INSERT INTO work_experience (title, role, period, description, sort_order) VALUES
('BSIT Projects', 'Frontend Dev, UI Design, IoT Support', '2022 - Present', 'Contributing to various academic and capstone projects including frontend development, UI/UX design, and IoT hardware support.', 1),
('E-Commerce Website', 'Full-Stack Development', '2023', 'Built a full-stack e-commerce website using Firebase for backend and hosting with user authentication.', 2),
('WordPress E-Commerce', 'Website Development', '2023', 'Developed a WordPress-powered e-commerce website for a cosmetics/drugstore business.', 3);
