# Momento

### Your memories, told like a story.

Momento is a digital memory book designed to turn photos and personal moments into **stories you can revisit**, rather than simply storing them as files.

Instead of organizing memories into endless folders, Momento brings albums, photos, locations, timelines, and personal moments together in a visual, story-driven experience.

> **Your moments, told like a story — not stored like files.**

---

## ✨ Overview

Momento is built around the idea that memories should feel **personal, visual, and easy to revisit**.

The application combines:

- 📸 Photo albums
- 🖼️ Automatic photo collages
- 🗺️ Location-based memories
- 📅 Timeline & chronological browsing
- 👤 Personal profile
- 📊 Memory statistics
- 🔐 Google authentication
- ☁️ Cloud photo storage

The focus is on creating a **calm, visual experience for remembering**, rather than treating photos like ordinary files.

---

## 📱 Main Experience

### 🏠 Home

A visual overview of your memories.

- Recent albums
- Featured moments
- Photo highlights
- Memory statistics
- Quick access to important moments

The Home experience is designed to make your memories feel immediately accessible without having to search through folders.

---

### 📖 Albums

Organize memories into meaningful collections.

Each album can contain its own collection of photos and moments, making it easy to separate memories by:

- Trips
- Events
- People
- Places
- Personal milestones
- Everyday moments

---

### 🖼️ Automatic Collage

One of Momento's core features is its **automatic collage engine**.

Instead of displaying every photo in a simple grid, Momento generates a justified-row layout that adapts to the photos' aspect ratios.

The result creates a more editorial, story-like presentation.

Features include:

- Automatic layout generation
- Preserved photo aspect ratios
- Landscape hero images
- Consistent spacing
- Rounded corners
- Deterministic layouts

The same album produces the same layout, while different albums can have different visual rhythms.

---

### 🗺️ Memory Map

Photos can be connected to their locations and explored through an interactive map.

The Map experience allows memories to become connected to **where they happened**, giving the collection a more geographical perspective.

Powered by Google Maps.

---

### 📅 Timeline

Browse memories chronologically.

The timeline provides another way to revisit your photos without relying entirely on albums, making it easier to rediscover older moments.

Photos are loaded progressively through infinite scrolling for a smoother browsing experience.

---

### 👤 Profile

Personal settings and preferences in one place.

- Google account
- Theme preference
- Dark mode
- Personal settings
- Application preferences

Theme preferences are persisted and applied before the page is rendered to avoid unnecessary visual flickering.

---

## 🎨 Design Philosophy

Momento is designed around a **visual-first and story-driven experience**.

The interface focuses on:

- Minimal visual clutter
- Large, immersive imagery
- Editorial-style layouts
- Smooth transitions
- Responsive design
- Dark mode
- Mobile-first interactions

The goal is to make browsing memories feel closer to **looking through a personal photo book** than navigating a file manager.

---

## 🧩 Tech Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### Backend & Infrastructure

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

### Integrations

![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)
![Google](https://img.shields.io/badge/Google_Auth-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 🏗️ Architecture

Momento uses a feature-oriented architecture designed to keep UI, business logic, and data access separated.

```text
src/
├── app/
│   ├── (app)/             # Main application shell
│   ├── login/             # Authentication
│   └── auth/              # Auth callbacks
│
├── components/            # Shared UI & navigation
├── features/              # Feature-specific modules
│   ├── albums/
│   ├── collage/
│   ├── photos/
│   ├── create/
│   └── map/
│
├── services/              # Database & server data access
├── hooks/                 # Shared custom hooks
├── lib/                   # Pure utilities
├── types/                 # Domain & database types
└── config/                # Static application configuration

supabase/
├── migrations/            # Database schema & security policies
└── seed.sql               # Sample data
