import { Component, StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dm-mono/latin-300.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/fraunces/latin-400.css'
import '@fontsource/fraunces/latin-400-italic.css'
import '@fontsource/fraunces/latin-500.css'
import '@fontsource/fraunces/latin-500-italic.css'
import '@fontsource/outfit/latin-300.css'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import App from './App.tsx'
import './index.css'

type BoundaryState = { error: string | null }

class Boundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: error instanceof Error ? error.message : 'Something went wrong.' }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-dvh place-items-center bg-[#0b0c0e] px-6 text-center text-[#f6f1e7]">
          <div className="max-w-md">
            <p className="font-serif text-4xl italic">Meridian hit a snag.</p>
            <p className="mt-3 text-sm text-[#cfc8bc]">{this.state.error}</p>
            <button type="button" className="mt-6 underline" onClick={() => location.reload()}>
              Reload the lock screen
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing root')

createRoot(root).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)
