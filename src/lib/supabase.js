import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://putzagczushgbdtuagcq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qbM-bvjZdsvh9DfGkX6UnQ_ExhlBU9r';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fallback Initial Data
export const INITIAL_RESOURCES = [
  {
    id: 101,
    title: '2023 G.C.E. A/L Combined Mathematics Past Paper & Model Scheme',
    category: 'Past Paper',
    file_name: '2023_AL_Combined_Maths_Paper.pdf',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '3.4 MB',
    link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'இலங்கை க.பொ.த உயர்தர இணைந்த கணிதம் 2023 வினாத்தாள் மற்றும் மாதிரி விடைத்தாள் குறிப்புகள்.',
    downloads: 1420,
    status: 'Published',
    date: '2024-02-15'
  },
  {
    id: 102,
    title: 'G.C.E. O/L Science Comprehensive Revision Notes (Tamil Medium)',
    category: 'Notes',
    file_name: 'OL_Science_Revision_Notes.pdf',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '5.8 MB',
    link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'சாதாரண தர மாணவர்களுக்கான அறிவியல் பாட முழுமையான அலகுவாரிக் குறிப்புகள் மற்றும் விளக்கங்கள்.',
    downloads: 980,
    status: 'Published',
    date: '2024-03-01'
  },
  {
    id: 103,
    title: 'General Knowledge & Current Affairs Quiz Booklet 2024',
    category: 'GK',
    file_name: 'GK_Quiz_Booklet_2024.pdf',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '2.1 MB',
    link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'பொது அறிவுப் போட்டிகள் மற்றும் போட்டிப் பரீட்சைகளுக்கான 500+ மாதிரி வினா விடைகள் கொண்ட தொகுப்பு.',
    downloads: 650,
    status: 'Published',
    date: '2024-03-20'
  },
  {
    id: 104,
    title: 'G.C.E. A/L Physics Electricity Unit Summary Notes',
    category: 'Notes',
    file_name: 'AL_Physics_Electricity.pdf',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '4.2 MB',
    link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'உயர்தர பௌதிகவியல் மின்னோட்டவியல் அலகிற்கான முக்கிய சூத்திரங்கள் மற்றும் கையேடு.',
    downloads: 1120,
    status: 'Published',
    date: '2024-04-05'
  }
];

export const INITIAL_EVENTS = [
  {
    id: 201,
    title: 'G.C.E. A/L Exam Preparation & Time Management Webinar',
    event_date: '2024-11-15',
    date: '15 Nov 2024 | 06:30 PM',
    location: 'Zoom Online Seminar',
    registered_count: 340,
    status: 'Upcoming',
    description: 'உயர்தர பரீட்சைக்குத் தோற்றும் மாணவர்களுக்கான நேர மேலாண்மை மற்றும் பாட மீளாய்வு வழிகாட்டல் கருத்தரங்கு.'
  },
  {
    id: 202,
    title: 'O/L Mathematics Problem Solving Live Workshop',
    event_date: '2024-11-20',
    date: '20 Nov 2024 | 05:00 PM',
    location: 'Edufamily YouTube Live',
    registered_count: 512,
    status: 'Upcoming',
    description: 'சாதாரண தர கணித பாடத்தில் சிக்கலான வினாக்களுக்கு இலகுவாக விடையளிக்கும் நுட்பங்கள் பற்றிய கருத்தரங்கு.'
  },
  {
    id: 203,
    title: 'Higher Studies & Career Guidance Summit 2024',
    event_date: '2024-10-05',
    date: '05 Oct 2024 | 10:00 AM',
    location: 'Zoom & Facebook Live',
    registered_count: 890,
    status: 'Completed',
    description: 'பல்கலைக்கழகப் பிரவேசம் மற்றும் தொழில் வழிகாட்டல் தொடர்பான நிபுணர்களின் கலந்துரையாடல்.'
  }
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 301,
    title: '2024 G.C.E. O/L Exam Dates & Admission Details Released',
    priority: 'Urgent',
    audience: 'O/L Students',
    date: '2024-10-01',
    is_active: true,
    description: '2024 சாதாரண தர பரீட்சைக்கான கால அட்டவணை மற்றும் அனுமதிக்கடிதங்கள் தொடர்பான உத்தியோகபூர்வ தகவல்.'
  },
  {
    id: 302,
    title: 'Edufamily WhatsApp Study Group Links Updated for 2025 Batch',
    priority: 'Important',
    audience: 'All Students',
    date: '2024-09-28',
    is_active: true,
    description: '2025 உயர்தர மற்றும் சாதாரண தர மாணவர்களுக்கான உத்தியோகபூர்வ வாட்ஸ்அப் குழுக்கள் உருவாக்கப்பட்டுள்ளன.'
  },
  {
    id: 303,
    title: 'Free Model Question Paper Series Starting Next Week',
    priority: 'General',
    audience: 'A/L Students',
    date: '2024-09-20',
    is_active: true,
    description: 'உயர்தர அறிவியல் மற்றும் வர்த்தகப் பிரிவு மாணவர்களுக்கான இலவச மாதிரி வினாத்தாள் தொடர் ஆரம்பமாகிறது.'
  }
];

export const INITIAL_SETTINGS = {
  wa_number: '+94 78 467 4025',
  wa_link: 'https://wa.me/94784674025',
  wa_channel: 'https://whatsapp.com/channel/0029VafVyoB2ZjCuGohiJe2V',
  official_email: 'info@edufamily.lk',
  yt_channel: 'https://youtube.com/@edufamilyintamil',
  banner_announcement: 'Edufamily in Tamil - புதிய மாதிரி வினாத்தாள்கள் வளங்கள் பக்கத்தில் பதிவேற்றப்பட்டுள்ளன!'
};
