import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { SettingsProvider, useSettings } from './hooks/useSettings'
import { migrateToPersonalisedConfig } from './utils/migrate'
import Layout from './components/Layout'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Water from './pages/Water'
import Meals from './pages/Meals'
import Exercise from './pages/Exercise'
import Weight from './pages/Weight'
import Progress from './pages/Progress'
import Report from './pages/Report'
import Gallery from './pages/Gallery'
import ManageReminders from './pages/ManageReminders'
import Settings from './pages/Settings'
import Splash from './components/Splash'

function AppRouter() {
  const { settings, ready } = useSettings()

  // One-time migration to the personalised schedule config (existing installs)
  useEffect(() => {
    if (ready) migrateToPersonalisedConfig()
  }, [ready])

  if (!ready) {
    return (
      <HashRouter>
        <Splash />
      </HashRouter>
    )
  }

  if (!settings.onboardingComplete) {
    return (
      <HashRouter>
        <Onboarding />
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/water" element={<Water />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/exercise" element={<Exercise />} />
          <Route path="/weight" element={<Weight />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/report" element={<Report />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/reminders" element={<ManageReminders />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRouter />
    </SettingsProvider>
  )
}