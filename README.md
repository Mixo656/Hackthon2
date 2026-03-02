# Smart Calm AI 🧠✨

A modern web application designed to help users monitor and manage stress levels through interactive mindfulness activities, rhythm analysis, and AI-powered suggestions.

## Features

### 🔍 Stress Assessment
- **Rhythm Tap Analysis**: Tap along to detect heart rate variability and patterns
- **Motion Sensing**: Tracks body movement intensity using device accelerometers
- **AI-Powered Insights**: Get personalized stress level assessments and recommendations

### 🎯 Mindfulness Interventions
- **Breathing Exercises**: Guided box breathing with visual cues (3 cycles)     
- **Thought Release**: Swipe card interface to process and let go of stressful thoughts
- **Voice Chat**: AI-powered voice assistant for supportive conversations
- **Focus Game**: Alphabet clicking game for mental grounding

### 📊 History & Tracking
- Session history with stress level trends
- Visual stress data visualization
- Personal progress tracking

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **State Management**: TanStack React Query
- **Charts**: Recharts
- **Audio**: Web Audio API
- **AI Integration**: Cloud-based AI services

## Project Structure

```
├── src/
│   ├── pages/                 # Page components (auto-routed)
│   │   ├── Home.jsx          # Main stress check-in experience
│   │   └── History.jsx       # Session history view
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn UI components
│   │   ├── AlphabetGame.jsx  # Focus activity
│   │   ├── BreathingExercise.jsx
│   │   ├── VoiceChat.jsx     # Voice AI chat
│   │   ├── SwipeCard.jsx     # Thought release activity
│   │   ├── RhythmTap.jsx     # Rhythm detection
│   │   ├── MotionSensor.jsx  # Motion tracking
│   │   └── StressResults.jsx # Results display
│   ├── lib/                   # Utilities & services
│   │   ├── ai-chat.js        # AI integration
│   │   ├── storage.js        # LocalStorage management
│   │   ├── query-client.js   # React Query setup
│   │   └── utils.js          # Helper functions
│   ├── hooks/                 # Custom React hooks
│   ├── App.jsx               # Main app component
│   ├── Layout.jsx            # App layout wrapper
│   └── main.jsx              # Entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
https://github.com/Mixo656/Hackthon2.git
cd smart-ai
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - TypeScript type checking

## How It Works

### Stress Check-In Flow

1. **Welcome** → User indicates they want to check their stress level
2. **Motion & Rhythm Detection** → Captures body motion and rhythm patterns
3. **Analysis** → AI analyzes variance and intensity to determine stress level
4. **Results** → Displays stress assessment with personalized recommendations
5. **Interventions** → User selects from 4 mindfulness activities
6. **Completion** → Celebratory feedback when all activities are done

### Data Collection

The app collects (with user consent):
- Tap timing patterns (for rhythm analysis)
- Device motion/accelerometer data
- Voice audio (when using voice chat)
- Session timestamps and stress levels

All data is stored locally in browser storage.

## Configuration

### Pages Configuration
Edit `src/pages.config.js` to manage page routing:
```javascript
export const pagesConfig = {
  mainPage: "Home",        // Landing page
  Pages: PAGES,            // Available pages
  Layout: __Layout,        // Wrapper layout
};
```

New pages created in `src/pages/` are automatically registered.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Vercel will auto-detect Vite and deploy

Or deploy via CLI:
```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms

**Netlify:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

**GitHub Pages:**
Update `vite.config.js`:
```javascript
export default {
  base: '/repository-name/',
  // ...
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with accelerometer support

## Privacy & Data

- All user data is stored locally in browser storage
- No personal data is sent to external servers except for AI API calls
- Sessions can be cleared from the History page
- Microphone/motion sensor access requires user permission

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Wearable device integration (Apple Watch, Fitbit)
- [ ] Push notifications for daily check-ins
- [ ] Social features (share achievements)
- [ ] Advanced analytics dashboard
- [ ] Offline support (PWA)
- [ ] Multiple language support
- [ ] Personalized wellness plans

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Vite
- UI components from shadcn/ui
- Animations powered by Framer Motion
- Special thanks to all contributors

---

**Made with 💙 for mental wellness**
