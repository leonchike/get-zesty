# Recipe Manager Mobile - Development Guide

## Build Commands
- Start dev server: `npm start` or `expo start`
- Run on iOS: `npm run ios`
- Run on Android: `npm run android`
- Run on Web: `npm run web`
- Run tests: `npm test` or `npm test -- --testNamePattern="ThemedText"`
- Lint code: `npm run lint`
- Type check: `npm run typecheck`
- Reset project: `npm run reset-project`

## Code Style Guidelines
- **TypeScript**: Use strict typing (strict mode enabled in tsconfig)
- **Imports**: Organize imports by type (React, libraries, local modules)
- **Component Structure**: Use functional components with hooks
- **Styling**: Use NativeWind (Tailwind for React Native)
- **State Management**: Use Zustand for global state
- **Navigation**: Use Expo Router for navigation
- **Data Fetching**: Use React Query for API calls and data management

## Project Architecture
- Group related functionality in `/features` directory
- Reusable UI components in `/components`
- Global types in `/lib/types.d.ts`
- Context providers in `/context`
- Global stores in `/stores`

## Git Workflow
- Work on feature branches named by issue number/feature
- Keep commits atomic and focused
- Use descriptive commit messages