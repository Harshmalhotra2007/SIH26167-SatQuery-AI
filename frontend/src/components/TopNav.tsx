import { useState } from 'react'

type Tab = 'analyze' | 'compare' | 'history'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TopNav({ activeTab, onTabChange }: Props) {
  const tabs = [
    { id: 'analyze' as const, label: 'Analyze' },
    { id: 'compare' as const, label: 'Compare' },
    { id: 'history' as const, label: 'History' },
  ] as const

  return (
    <header className="border-b border-slate-800 px-4 py-3 bg-slate-900/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  )
}