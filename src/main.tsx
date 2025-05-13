
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client.ts'

// Log Supabase initialization for debugging
console.log("Initializing app with Supabase URL:", supabase.supabaseUrl);

createRoot(document.getElementById("root")!).render(<App />);
