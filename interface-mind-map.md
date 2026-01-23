# Interface.mind map   
   
- This is a web browser app built for live poker players.   
- More efficient way to share hands with people.   
 --- 
- Main slide   
    - logging with Email   
        - Hand record page   
            - Shows user's saved hands   
        - Add a hand page   
            - A page that ask you to input game type/numbers of players    
                - game type   
                    NLH(MVP)   
                - numbers of players(10max)   
                    1. Start to enter the game state. First input Big/Small Blinds amount.   
                        - Preflop   
                            1. Choose hero's position, then choose hero's cards.   
                            2. Give users a list of choices which position has actions from early position to the last.  At the same time, user could adjust stakes(default 100BB) of player's that has involved actions.   
                        - Flop   
                            1. Choose 3 board cards   
                            2. Choose action from early position to the last.    
                        - Turn   
                            1. Choose one board cards   
                            2. Choose action from early position to the last.    
                        - River   
                            1. Choose one board cards   
                            2. Choose action from early position to the last.    
                        - Output hand history to a format of video/User can also decide whether save this hand or not.(I think we need a max limit for free users, maybe 10 hands)   
   
### **Design System Blueprint**   
### 1. The Palette: "High Contrast Slate"   
Avoid pure black ( `#000000`). For a premium "Studio" feel, use deep blue-greys (Slates) which reduce eye strain and look better on video compression algorithms (YouTube/TikTok).   
- **Background (Canvas):** `Slate-950` ( `#020617`) — The main backdrop.   
- **Surface (Cards/Table container):** `Slate-900` ( `#0f172a`) — distinct from the background to create depth.   
- **Text (Primary):** `Slate-50` ( `#f8fafc`) — For board cards and crucial action text.   
- **Text (Secondary):** `Slate-400` ( `#94a3b8`) — For labels like "Preflop" or "Blinds".   
- **Accents (The "Action" Colors):**   
    - **Bet/Raise:** Electric Green ( `#10b981`)   
    - **Fold:** Muted Red ( `#ef4444`)   
    - **Hero Indicator:** Cyan ( `#06b6d4`) — To quickly identify the user's position.   
   
### 2. Typography: "Data vs. Narrative"   
- **Numbers (Stakes, Bet Sizes, Pot Odds):** Use a **Monospace** font (e.g., *JetBrains Mono* or *Roboto Mono*). This aligns with the "solver" aesthetic and ensures numbers line up perfectly in the video output.   
- **UI Text (Buttons, Instructions):** Use a clean, geometric **Sans-Serif** (e.g., *Inter* or *DM Sans*). It stays out of the way and keeps the interface looking modern.   
   
### 3. Key Component Behaviors   
- **The "Streamer" Toggle:** Consider adding a "Privacy Mode" toggle near the "Hand Record Page". When off, it shows exact dollar amounts. When on (for video export), it automatically converts all stack sizes  and bets into **Big Blinds (BB)**. This is the industry standard for sharing hands publicly.   
    +1   
- **Input Method:** For the "Add a Hand" page, use **steppers** rather than long forms.   
    - *Step 1:* Setup (Game Type/Players)   
    - *Step 2:* Preflop Action   
    - *Step 3:* Board & Post-flop   
        +2   
    - *Reasoning:* This keeps the interface clean on mobile devices where screen real estate is limited.   
   
### 4. Tech Stack Recommendation   
Since this is a web browser app  and you are likely using React (based on your `npm run dev` history), this stack will give you the "Dark Mode Studio" look out of the box with minimal custom CSS:   
- \*\*Styling:\*\***Tailwind CSS** (excellent built-in color palettes for dark mode).   
- \*\*UI Library:\*\***shadcn/ui** (highly popular, clean, professional components that look like Vercel/Linear).   
- **Icons:** **Lucide React** (crisp, vector icons ideal for "efficient" interfaces).   
   
   
