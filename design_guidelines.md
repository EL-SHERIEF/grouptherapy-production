# GroupTherapy Record Label - Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from major record labels (Interscope Records, Def Jam) and modern music platforms (Apple Music, BBC Sounds, Spotify) known for multimedia-rich interfaces with integrated players and dynamic content presentation.

**Key Principles**:
- Bold, oversized album art and hero imagery
- Clean editorial layouts with strong visual hierarchy
- Persistent player UX (sticky mini-player + expanded view)
- Media-first content presentation
- Dark mode optimized for music consumption experience

---

## Typography

**Font Families**:
- **Headlines**: Space Grotesk (700 weight for main titles, 600 for section headers)
- **Body**: Geist (400 regular, 500 medium for emphasis, 300 light for metadata)

**Scale** (mobile → desktop):
- Hero titles: text-4xl → text-6xl (bold, tight leading)
- Section headers: text-2xl → text-4xl
- Card titles: text-lg → text-xl
- Body text: text-base
- Metadata/labels: text-sm → text-base (light weight, uppercase tracking)

**Hierarchy**:
- Artist names and release titles: bold, high contrast
- Supporting info (dates, venues, genres): lighter weight, reduced opacity
- CTAs: medium weight, prominent sizing

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: py-12 (mobile) → py-20 (desktop)
- Card gaps: gap-4, gap-6, gap-8
- Margins: m-4, m-6, m-8

**Grid System**:
- 12-column responsive grid
- Content max-width: max-w-7xl with px-4/6/8 horizontal padding
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

**Viewport Usage**:
- Hero sections: 70-80vh with content overlay
- Content sections: Natural height, consistent py-12 → py-24
- Never force sections into rigid viewport constraints

---

## Component Library

### Navigation
- **Desktop**: Horizontal nav with logo left, links center, CTA (radio/login) right, sticky on scroll with backdrop blur
- **Mobile**: Hamburger menu, full-screen overlay with large touch targets
- Live radio indicator badge when stream active

### Hero Sections
- **Home**: Full-width image/video background, large album art grid overlay, centered headline, primary CTA
- **Pages**: 50-60vh height, gradient overlay on images, breadcrumb trail

### Carousels
- **Releases (20+ slides)**: Horizontal scroll, large album covers (aspect-ratio-square), auto-advance with manual controls, keyboard accessible, lazy-load images
- **Events**: Card-based slider, 1-3 visible per viewport, peek next card on mobile
- Smooth momentum scrolling, progress dots or counter

### Media Cards
- **Release Cards**: Square album art, hover lift effect, title + artist below, streaming badge overlay
- **Event Cards**: 16:9 featured image, date badge top-left, venue/location text, ticket CTA
- **Blog Cards**: Vertical format, 3:2 image, category tag, excerpt preview

### Radio Player
- **Global Mini-Player**: Fixed bottom bar, play/pause icon, track metadata scrolling, volume slider, expand button, progress bar
- **Expanded Player**: Full-width section or modal, large album art, waveform visualization, show schedule preview, chat integration (future)
- Controls: play/pause (large), skip, volume, repeat, quality toggle

### Admin Dashboard
- **Sidebar Navigation**: Fixed left (desktop), collapsible (tablet), dark themed
- **Content Tables**: Sortable columns, quick actions (edit/delete/publish), bulk select, search/filter bar
- **Forms**: Clean field groups, inline validation, rich text editor for blog, media upload with preview, save/publish split actions
- **Metrics Dashboard**: Cards with key stats, recent activity feed, quick access to content management

### Forms
- **Contact/Demo Submission**: Clear field labels, floating placeholders, file upload dropzone, category selector (press/talent/booking), anti-spam honeypot, confirmation message
- Consistent input styling: border-2, rounded-lg, focus:ring-2

### Content Grids
- **Videos**: Masonry or grid layout, 2-3 columns desktop, lazy-load thumbnails, play icon overlay
- **Tours**: List view with map integration, alternates to calendar grid view
- **Press/News**: Magazine-style featured article + 2-column grid below

---

## Images

**Hero Images**:
- **Home**: Large hero section (80vh) with featured artist or latest release campaign imagery - bold, high-contrast photos showcasing artists or album art
- **Radio Page**: Studio/DJ booth imagery with atmospheric lighting, streaming waveform overlay
- **About**: Team photo or label history montage in banner position

**Content Images**:
- Album covers: Square format throughout (1:1 aspect ratio)
- Event images: 16:9 landscape for cards and headers
- Artist photos: Portrait orientation for bios, square for thumbnails
- Video thumbnails: 16:9 with play icon overlay centered

**Treatment**: All images use object-cover, lazy-loading, progressive enhancement. Hero images have gradient overlays (black to transparent) for text legibility.

---

## Interactive Elements

**Animations**: Minimal, purposeful (Framer Motion)
- Card hover: Slight lift (translateY -2px), subtle shadow increase
- Carousel transitions: Smooth slide, fade metadata
- Player controls: Icon state changes (play ↔ pause)
- Page transitions: Fade-in content on route change

**Accessibility**:
- Keyboard navigation for all carousels and player controls
- ARIA labels on interactive music components
- Focus visible states with outline-offset-2
- Color contrast meets WCAG AA standards

---

## Color Application

**Light Theme**:
- Backgrounds: white for pages, light grey (hsl(0, 0%, 96.47%)) for cards
- Text: black for headings/body
- Accents: Lime green for CTAs, hover states, active indicators, radio live badge
- Borders: Grey at 10-20% opacity for subtle separation

**Dark Theme**:
- Backgrounds: True black for pages, dark grey cards (hsl(228, 9.8%, 10%))
- Text: Light grey (hsl(200, 6.67%, 91.18%))
- Accents: Blue (hsl(203.77, 87.6%, 52.55%)) for CTAs and active states
- Player chrome: Slightly elevated card surface with blur backdrop

**Consistent Application**: Use lime/blue for all primary actions (buttons, links, badges). Black/white for typography hierarchy. Grey tones for surfaces and borders only.