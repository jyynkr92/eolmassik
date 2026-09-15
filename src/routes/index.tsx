import { createFileRoute } from '@tanstack/react-router'

const HomePage = () => {
  return (
    <main className="p-5">
      <h1 className="text-on-surface-base text-2xl font-bold">얼마씩</h1>
      <p className="text-on-surface-muted mt-1 text-sm">가입 없이 링크 하나로 끝내는 1/N 정산</p>
    </main>
  )
}

HomePage.displayName = 'HomePage'

export const Route = createFileRoute('/')({ component: HomePage })
