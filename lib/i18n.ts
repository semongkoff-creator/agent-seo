export type Locale = 'en' | 'id';

export const LOCALE_COOKIE = 'seo-agent-locale';

function normalizeLocale(value?: string | null): Locale {
  return value?.toLowerCase() === 'id' ? 'id' : 'en';
}

export function getLocaleFromValue(value?: string | null): Locale {
  return normalizeLocale(value);
}

export function getLocaleLabel(locale: Locale) {
  return locale === 'id' ? 'Bahasa Indonesia' : 'English';
}

export function getAppCopy(locale: Locale) {
  const isId = locale === 'id';

  return {
    shell: {
      appName: 'SEO Agent',
      subtitle: isId ? 'Asisten SEO' : 'Expert Co-pilot',
      searchPlaceholder: isId ? 'Cari keyword, URL, atau project...' : 'Search keywords, URLs, or projects...',
      exportData: isId ? 'Ekspor Data' : 'Export Data',
      runAudit: isId ? 'Jalankan Audit' : 'Run Audit',
      newProject: isId ? 'Project Baru' : 'New Project',
      profile: isId ? 'Profil' : 'Profile',
      help: isId ? 'Bantuan' : 'Help',
      openNavigation: isId ? 'Buka navigasi' : 'Open navigation',
      closeNavigation: isId ? 'Tutup navigasi' : 'Close navigation',
      dashboard: isId ? 'Dashboard' : 'Dashboard',
      projects: isId ? 'Projects' : 'Projects',
      diagnoses: isId ? 'Diagnosis' : 'Diagnoses',
      campaigns: isId ? 'Campaign' : 'Campaigns',
      objectives: isId ? 'Objective' : 'Objectives',
      settings: isId ? 'Pengaturan' : 'Settings',
      language: isId ? 'Bahasa' : 'Language'
    },
    dashboard: {
      eyebrow: isId ? 'Dashboard' : 'Dashboard',
      title: isId ? 'Ringkasan Dashboard' : 'Dashboard Overview',
      description: isId
        ? 'Pantau project SEO aktif, lihat sinyal terbaru, dan lanjut dari setup ke eksekusi yang didukung n8n lebih cepat.'
        : 'Track active SEO projects, review the latest signals, and move from setup to n8n-powered execution in fewer steps.',
      liveWorkspace: isId ? 'Workspace langsung' : 'Live workspace',
      jakartaTime: isId ? 'Waktu Jakarta' : 'Jakarta time',
      waitingForEvent: isId ? 'Menunggu event Supabase pertama' : 'Waiting for first Supabase event',
      orchestratedBy: isId ? 'Diorkestrasi oleh n8n' : 'Orchestrated by n8n',
      heroTitle: isId ? 'Satu tampilan untuk seluruh SEO engine.' : 'One view for the entire SEO engine.',
      heroBody: isId
        ? 'Aksi dari website memicu backend, n8n menjalankan workflow, dan Supabase menyimpan hasilnya. Panel ini menampilkan status live dari alur itu tanpa data palsu.'
        : 'Website actions trigger the backend, n8n runs the workflow, and Supabase stores the result. This panel shows the live state of that loop without any placeholder data.',
      quickStart: isId ? 'Langkah cepat' : 'Quick Start',
      quickStartTitle: isId ? 'Jalur tercepat dari brief ke workflow' : 'The shortest path from brief to workflow',
      activeProjects: isId ? 'Project Aktif' : 'Active Projects',
      activeProjectsTitle: isId ? 'Visibility, authority, dan trend' : 'Visibility, authority, and trend',
      recentDiagnoses: isId ? 'Diagnosis Terbaru' : 'Recent Diagnoses',
      recentDiagnosesTitle: isId ? 'Sinyal diagnosis terbaru' : 'Latest diagnosis signals',
      noProjectsTitle: isId ? 'Belum ada project' : 'No projects yet',
      noProjectsBody: isId
        ? 'Buat project pertama untuk memulai alur identify. Begitu n8n menulis hasil ke Supabase, kartu project akan terisi otomatis.'
        : 'Create your first project to start the identify workflow. Once n8n writes the result to Supabase, the project cards will populate automatically.',
      noDiagnosesTitle: isId ? 'Belum ada diagnosis' : 'No diagnoses yet',
      noDiagnosesBody: isId
        ? 'Saat identify berjalan lewat n8n dan menyimpan hasil ke Supabase, kartu diagnosis akan muncul di sini.'
        : 'When identify runs through n8n and stores the result in Supabase, the diagnosis cards will appear here.',
      workspacePulse: isId ? 'Pulse workspace' : 'Workspace pulse',
      n8nStatus: isId ? 'Status n8n' : 'n8n status',
      openProjects: isId ? 'Buka projects' : 'Open projects'
    },
    projects: {
      eyebrow: 'Projects',
      title: isId ? 'Project Aktif' : 'Active Projects',
      description: isId
        ? 'Buat project, jalankan identify, lalu definisikan objective. Halaman ini menyimpan alur inti di satu tempat.'
        : 'Create a project, run identify, then define the objective. This page keeps the core workflow in one place.',
      createTitle: isId ? 'Buat project baru' : 'Create a new project',
      createBody: isId
        ? 'Buka modal, isi brief, lalu lanjut ke Identify tanpa meninggalkan halaman ini.'
        : 'Open the modal, fill the brief, and jump straight into Identify without leaving this page.',
      howItWorks: isId ? 'Cara kerja' : 'How it works',
      step1: isId ? '1. Buat project' : '1. Create the project',
      step1Body: isId
        ? 'Simpan domain, target audience, dan goal bisnis agar workflow punya starting point yang tepat.'
        : 'Save the domain, target audience, and business goal so the workflow has the right starting point.',
      step2: isId ? '2. Jalankan identify' : '2. Run identify',
      step2Body: isId
        ? 'Website mengirim brief ke n8n, yang menganalisisnya dan menyimpan diagnosis ke Supabase.'
        : 'The website sends the brief to n8n, which analyzes it and stores the diagnosis in Supabase.',
      step3: isId ? '3. Definisikan objective' : '3. Define the objective',
      step3Body: isId
        ? 'Ubah diagnosis menjadi SMART objective, lalu lanjutkan ke campaign planning.'
        : 'Turn the diagnosis into a SMART objective, then continue into campaign planning.',
      emptyTitle: isId ? 'Belum ada project' : 'No projects yet',
      emptyBody: isId
        ? 'Buat project pertama untuk memulai alur identify yang didukung n8n. Begitu project ada, dashboard dan workflow akan terisi otomatis dari Supabase.'
        : 'Create the first project to start the n8n-powered identify flow. Once the project exists, the dashboard and workflows will fill in automatically from Supabase.',
      openIdentifyHub: isId ? 'Buka hub Identify' : 'Open Identify hub',
      startIdentify: isId ? 'Mulai identify' : 'Start identify',
      openObjective: isId ? 'Buka objective' : 'Open objective',
      viewReport: isId ? 'Lihat laporan' : 'View report'
    },
    identify: {
      title: isId ? 'Mulai diagnosis run' : 'Start a diagnosis run',
      description: isId
        ? 'Pilih project dan lanjutkan wizard Identify. Draft akan tersimpan otomatis di setiap langkah, lalu n8n menganalisis submission dan menyimpan hasil ke Supabase.'
        : 'Pick a project and continue the Identify wizard. Drafts autosave on each step, then n8n analyzes the submission and stores the result in Supabase.',
      flow1: isId ? '1. Pilih project' : '1. Pick a project',
      flow2: isId ? '2. Isi wizard 6 langkah' : '2. Complete the 6-step wizard',
      flow3: isId ? '3. Draft tersimpan otomatis' : '3. Drafts autosave as you move',
      flow4: isId ? '4. Submit ke n8n untuk analisis' : '4. Submit to n8n for analysis',
      flow5: isId
        ? '5. Buka halaman diagnosis, yang membaca hasil tersimpan dari Supabase'
        : '5. Review the diagnosis page, which reads the stored result from Supabase',
      viewProjects: isId ? 'Lihat projects' : 'View projects'
    },
    diagnosis: {
      monitorLabel: isId ? 'Membaca update Supabase' : 'Reading Supabase updates',
      diagnosisRunning: isId ? 'Diagnosis berjalan' : 'Diagnosis running',
      projectLabel: 'Project',
      checksLabel: isId ? 'Pengecekan' : 'Checks',
      failedTitle: isId ? 'Diagnosis gagal' : 'Diagnosis failed',
      backToIdentify: isId ? 'Kembali ke identify' : 'Back to identify',
      monitoringIssue: isId ? 'Masalah monitoring' : 'Monitoring issue',
      refresh: isId ? 'Muat ulang' : 'Refresh'
    },
    objective: {
      libraryTitle: isId ? 'Perpustakaan Objective' : 'Objective Library',
      description: isId
        ? 'Review SMART objective yang dihasilkan, kembali ke builder, atau buka campaign terkait.'
        : 'Review the generated SMART objectives, return to the builder, or open the related campaign.',
      emptyTitle: isId ? 'Belum ada objective' : 'No objectives yet',
      emptyBody: isId
        ? 'Setelah diagnosis selesai, Objective builder bisa mengubahnya menjadi SMART plan melalui n8n, lalu hasilnya disimpan ke Supabase.'
        : 'Once a diagnosis completes, the Objective builder can turn it into a SMART plan through n8n, then the result is stored in Supabase.',
      createProject: isId ? 'Buat project' : 'Create project',
      openDiagnoses: isId ? 'Buka diagnosis' : 'Open diagnoses'
    }
  };
}
