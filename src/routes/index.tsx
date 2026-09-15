import { createFileRoute } from '@tanstack/react-router'

import { COMMON_TEXT } from '@/constants/text/common'
import { HOME_TEXT } from '@/constants/text/home'

const HomePage = () => {
  return (
    <main className="p-5">
      <h1 className="text-on-surface-base text-2xl font-bold">{COMMON_TEXT.appName}</h1>
      <p className="text-on-surface-muted mt-1 text-sm">{HOME_TEXT.tagline}</p>
    </main>
  )
}

export const Route = createFileRoute('/')({ component: HomePage })
