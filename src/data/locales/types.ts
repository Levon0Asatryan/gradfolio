// Localization types
// Defines supported languages and the shape of the translation dictionary
// Used to enforce type-safe access to localized strings across the app

export type Language = "en" | "ru" | "am";

export interface Dictionary {
  common: {
    settings: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    dashboard: string;
    login: string;
    loginConnections: string;
    myAccount: string;
    projects: string;
    integrations: string;
    explorePortfolios: string;
    viewAll: string;
    editProfile: string;
    contact: string;
    edit: string;
    details: string;
    addNewProject: string;
    addProject: string;
    noProjectsYet: string;
    getStartedProject: string;
    searchProjects: string;
    allCategories: string;
    sortBy: string;
    newest: string;
    oldest: string;
    nameAZ: string;
    nameZA: string;
    present: string;
    backToProjects: string;
    githubRepo: string;
    liveDemo: string;
    description: string;
    attachments: string;
    noAttachments: string;
    attachmentsEvidence: string;
    openImage: string;
    projectImage: string;
    openVideo: string;
    videoThumbnail: string;
    openPDF: string;
    video: string;
    link: string;
    preview: string;
    close: string;
    attachmentImage: string;
    videoNotEmbedded: string;
    openExternally: string;
    useLinkToOpen: string;
    projectInfo: string;
    timeline: string;
    category: string;
    course: string;
    professor: string;
    teamMembers: string;
    technologies: string;
    image: string;
    pdf: string;
  };
  profile: {
    experience: string;
    education: string;
    noExperience: string;
    noEducation: string;
    verified: string;
    previewMode: string;
    editMode: string;
    skills: string;
    certifications: string;
    add: string;
    newSkill: string;
    noSkills: string;
    noCertifications: string;
    noProjects: string;
    verify: string;
  };
  integrations: {
    title: string;
    subtitle: string;
    connect: string;
    disconnect: string;
    connected: string;
    notConnected: string;
    synced: string;
    infoText: string;
    emptyState: string;
    lastSynced: string;
    descriptions: {
      linkedin: string;
      github: string;
    };
    buttons: {
      learnMore: string;
    };
    steps: {
      welcome: string;
      welcomeSubtitle: string;
      importGithub: string;
      importLinkedin: string;
      importingGithub: string;
      importingLinkedin: string;
      importedGithub: string;
      importedLinkedin: string;
      basic: {
        title: string;
        fullName: string;
        fullNameRequired: string;
        email: string;
        emailInvalid: string;
        birthday: string;
        github: string;
        linkedin: string;
        phone: string;
        website: string;
      };
      experience: {
        title: string;
        label: string;
        placeholder: string;
        educationLabel: string;
        educationPlaceholder: string;
      };
      repos: {
        title: string;
        label: string;
        placeholder: string;
        empty: string;
        hint: string;
      };
    };
    dialog: {
      connectTitle: string;
      connectDesc: string;
      cancel: string;
      confirm: string;
      disconnectTitle: string;
      disconnectDesc: string;
    };
    setup: {
      title: string;
      subtitle: string;
      back: string;
      next: string;
    };
  };
  projects: {
    categories: {
      course: string;
      personal: string;
      research: string;
      hackathon: string;
      academic: string;
      other: string;
    };
    status: {
      ongoing: string;
      completed: string;
      archived: string;
    };
    sort: {
      newest: string;
      oldest: string;
      nameAZ: string;
      nameZA: string;
    };
    form: {
      title: string;
      basicInfo: string;
      projectTitle: string;
      projectTitlePlaceholder: string;
      aiSummary: string;
      aiSummaryPlaceholder: string;
      aiSummaryHelper: string;
      liveDemoUrl: string;
      repoUrl: string;
      attachments: string;
      addMedia: string;
      noAttachments: string;
      addFirstAttachment: string;
      removeAttachment: string;
      addAttachmentTitle: string;
      type: string;
      url: string;
      attachmentTitle: string;
      cancel: string;
      add: string;
      saving: string;
      createProject: string;
    };
  };
  dashboard: {
    welcome: string;
    connections: string;
    engagement: string;
    projects: string;
    quickActions: string;
    recentProjects: string;
    activityFeed: string;
    noRecentActivity: string;
    noData: string;
    stats: {
      totalProjects: string;
      githubStars: string;
      linkedinConnections: string;
      recentActivities: string;
    };
    activity: {
      projectUpdated: string;
      profileViewed: string;
      newConnection: string;
      newFollower: string;
      newSkill: string;
    };
    activityTypes: {
      project: string;
      profile: string;
    };
  };
  search: {
    title: string;
    subtitle: string;
    placeholder: string;
    noResults: string;
    tryAdjusting: string;
    clearFilters: string;
    showingResults: string;
    featuredProjects: string;
    categories: {
      all: string;
      developers: string;
      designers: string;
      productManagers: string;
      dataScientists: string;
      researchers: string;
    };
  };
}
