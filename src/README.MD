# Unhinged App

## 📖 Overview
The **Unhinged App** is a mobile-first web application designed to connect creators of all types (musicians, photographers, videographers, explicit creators, writers, etc.) through collaboration-focused matchmaking. Unlike traditional social or content distribution platforms, this app is centered around **project boards** and **collaborator discovery**, with an optional content showcase lane.

The app combines the fun and simplicity of swipe-based interfaces (like Tinder/Feeld) with structured project postings, allowing creators to find each other based on *what they are looking to collaborate on*.

---

## ✨ Key Features
- **Onboarding Flow**: role selection, collaboration intent, NSFW/SFW filter.
- **Project Board**: swipe or apply to project cards with filters.
- **Profile Preview**: snapshot with portfolio + collaboration needs.
- **Content Lane**: secondary tab for portfolios and optional monetization.
- **New Project Creation**: simple form to post collab needs.
- **Chat / Collab Room**: planned for shared files, contracts, milestones.

---

## 🛠 Tech Stack
- **Frontend**: React + TailwindCSS + shadcn/ui components
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Styling**: TailwindCSS design system
- **State Management**: React hooks (extendable to Zustand/Redux)

---

## 🎨 Design System (Frontend UI)

### Style & Look and Feel
The **Unhinged design language** is playful, modern, and creator-focused. It avoids corporate stiffness and instead feels intuitive, engaging, and community-driven.

- **Colorful gradients**: vibrant purple and cyan tones are used to create energy and make CTAs stand out.
- **Rounded cards and buttons**: soft corners (`rounded-2xl`) give a friendly and inviting aesthetic.
- **Playful icons & emojis**: added alongside text (📸 🎶 🎨) to break formality and speak to creative audiences.
- **Minimal but engaging layouts**: mobile-first screens that feel like interactive cards rather than heavy forms.
- **Typography**: Inter Bold for headings (clear, modern), Inter Regular for body (clean, readable).
- **Animations**: micro-interactions for swiping, selecting, or submitting (confetti effects, button highlights).

### Page Structure
- **Home Feed**: stacked project cards with cover image, tagline, roles, and quick actions (🔥 Let’s Collab / 👋 Not Now).
- **Profile Page**: large cover image, avatar, tagline, vibes section, location, and roles. Looks like a creative business card rather than a CV.
- **Onboarding Flow**: stepper-based process with 5–6 steps, each on its own card-like page with progress bar. Includes welcome screen, roles, looking-for, visual identity upload, location, and finish.
- **Content Lane**: secondary tab for portfolio pieces (music, video, photos) with small previews and CTA buttons (▶️ Watch, 🔗 View).
- **Filters**: appear as a bar with toggle chips and sliders (Local 📍 / Remote 🌍 / Hybrid 🔀, SFW/NSFW toggle, radius slider).

---

## 📱 Example UI Previews

#### Home Feed (Collabs Tab)
![Homepage Collab Feed](./design/home-collabs.png)

#### Profile-Style Project Card
![Profile Card](./design/profile-card.png)

#### Location Filters
![Location Filter](./design/location-filters.png)

#### Profile Page (Creative & Engaging)
![Profile Page](./design/profile-page.png)

#### Onboarding Flow
![Onboarding Flow](./design/onboarding-flow.png)

---

## 📂 File Structure
```
unhinged-app/
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── ProjectCard.tsx
│   ├── ProfileCard.tsx
│   ├── ContentCard.tsx
│   └── Tabs.tsx
├── pages/
│   └── index.tsx (Main App)
├── supabase/
│   └── migrations/ (SQL migrations)
├── public/
│   └── assets (logos, icons, design mockups)
└── README.md
```

---

## 🗄 Supabase Integration
*(schema + migrations + RLS policies as defined earlier)*

---

## 🚀 Getting Started
### Installation
```bash
git clone https://github.com/your-org/unhinged-app.git
cd unhinged-app
npm install
npm run dev
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔮 Roadmap
- [ ] Authentication (Supabase Auth)
- [ ] Project Board with filters
- [ ] Swipe UI for collabs
- [ ] Profile creation + editing
- [ ] Content lane integration
- [ ] Chat & file sharing
- [ ] Payment split system

---

## 👥 Authors
- **Product Vision**: Anne & Daan
- **Initial Development**: Contributor team
