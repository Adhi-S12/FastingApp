# Intermittent Fasting App

A comprehensive React Native app built with Expo for tracking intermittent fasting sessions, weight, and progress.

## Features

### 🍽️ Core Fasting Tools
- **Start/Stop Fasting**: Easy one-tap start and stop functionality
- **Real-time Timer**: Live countdown showing remaining fasting time
- **Progress Tracking**: Circular progress indicator with beautiful animations
- **Fat Burning Indicator**: Shows when your body enters fat-burning mode
- **Mood Check-ins**: Track how you're feeling during fasts

### 📱 Beautiful Design
- **Modern UI**: Clean, rounded design with smooth animations
- **Dark/Light Mode**: Automatic theme switching
- **Fire Emoji Decorations**: Visual feedback around the progress circle
- **Floating Notifications**: Persistent timer when fasting is active
- **Gradient Colors**: Orange/yellow accent theme matching the design

### 📊 Analytics & History
- **Fasting History**: Complete log of all previous fasts
- **Statistics Cards**: Total fasts, completion rate, average duration
- **Progress Charts**: Visual representation of fasting patterns
- **Weekly Planning**: Customizable fasting schedule with bar charts
- **Success Tracking**: Completed vs partial fasts

### ⚖️ Weight Tracking
- **Weight Entry**: Easy weight logging with modal input
- **Progress Charts**: Visual weight progress over time
- **Goal Setting**: Set target weight and track progress
- **Recent Entries**: Quick view of recent weight measurements
- **Unit Support**: Both kg and lbs supported

### 🔔 Smart Notifications
- **Goal Completion**: Notification when fasting target is reached
- **Milestone Alerts**: Halfway point and fat-burning notifications
- **Motivation Messages**: Encouraging notifications during long fasts
- **Permission Handling**: Proper notification permission requests

### 💾 Local Data Storage
- **AsyncStorage**: All data stored locally on device
- **Persistent Sessions**: Active fasts survive app restarts
- **History Preservation**: Complete fasting and weight history
- **Fast Recovery**: App state restored after closing

## App Structure

### Screens
1. **Fasting Tab** (`app/(tabs)/index.tsx`)
   - Main fasting interface
   - Circular progress with timer
   - Start/stop controls
   - Weekly fasting plan
   - Fat burning tracking

2. **History Tab** (`app/(tabs)/history.tsx`)
   - Statistics overview
   - Progress charts
   - Detailed fasting history
   - Timeframe selection

3. **Profile Tab** (`app/(tabs)/profile.tsx`)
   - User profile management
   - Weight tracking
   - Settings and preferences
   - Weight progress charts

### Key Components

#### `CircularProgress` (`components/fasting/CircularProgress.tsx`)
- Animated circular progress indicator
- Fire emoji decorations around the circle
- Customizable size and stroke width
- Smooth progress transitions

#### `FloatingNotification` (`components/fasting/FloatingNotification.tsx`)
- Persistent timer overlay when fasting
- Animated entrance/exit
- Quick action buttons
- Platform-specific positioning

#### `useFasting` Hook (`hooks/useFasting.ts`)
- Complete fasting session management
- AsyncStorage integration
- Session state management
- History tracking

#### `useNotifications` Hook (`hooks/useNotifications.ts`)
- Smart notification scheduling
- Permission management
- Milestone notifications
- Motivational alerts

## Technical Features

### Animation & Interaction
- **React Native Reanimated**: Smooth animations throughout
- **Gesture Handling**: Responsive touch interactions
- **Spring Animations**: Natural feeling transitions
- **State Transitions**: Smooth switching between fasting states

### Data Management
- **TypeScript**: Full type safety
- **Async Storage**: Reliable local persistence
- **State Management**: Custom hooks for data flow
- **Error Handling**: Graceful error recovery

### Design System
- **Consistent Theming**: Unified color scheme
- **Responsive Layout**: Works on all screen sizes
- **Accessibility**: Proper text sizing and contrast
- **Platform Adaptation**: iOS/Android specific adjustments

## Usage

### Starting a Fast
1. Open the app to the Fasting tab
2. Tap "START" to begin a 16-hour fast
3. Watch the circular progress fill up
4. Receive notifications at milestones
5. Tap "END FASTING" when complete

### Viewing History
1. Switch to History tab
2. View statistics cards at the top
3. Check progress charts
4. Browse detailed fasting log
5. Filter by timeframe (week/month/year)

### Weight Tracking
1. Go to Profile tab
2. Tap the + button next to "Weight Tracking"
3. Enter your current weight
4. View progress charts and statistics
5. Track towards your target weight

### Customizing Settings
1. Access settings from Profile tab
2. Edit personal information
3. Adjust notification preferences
4. Toggle dark/light mode
5. Set fasting goals and targets

## Installation

```bash
npm install
npm start
```

The app will open in Expo Go for testing on your device.

## Dependencies

- `@react-native-async-storage/async-storage`: Local data storage
- `expo-notifications`: Smart notification system
- `expo-linear-gradient`: Beautiful gradient effects
- `react-native-svg`: Circular progress indicators
- `react-native-chart-kit`: Progress and weight charts
- `@react-native-community/datetimepicker`: Date/time selection

## Future Enhancements

- **Fasting Plans**: Pre-defined fasting schedules (16:8, 18:6, etc.)
- **Social Features**: Share progress with friends
- **Health Integration**: Sync with Apple Health/Google Fit
- **Advanced Analytics**: Detailed insights and trends
- **Backup/Sync**: Cloud storage for data backup
- **Widgets**: Home screen widgets for quick access
- **Apple Watch**: Companion watchOS app

---

Built with ❤️ using Expo and React Native