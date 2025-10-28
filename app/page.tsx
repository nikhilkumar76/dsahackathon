'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Stats {
  teachers: number
  subjects: number
  classrooms: number
  batches: number
  timetables: number
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-200 border-r border-gray-300 p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Amdraipt</h1>
          <p className="text-xs text-gray-600 mt-1">Timetable Generator</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeSection === 'dashboard'
                ? 'bg-gray-800 text-white font-semibold'
                : 'hover:bg-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('subjects')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeSection === 'subjects'
                ? 'bg-gray-800 text-white font-semibold'
                : 'hover:bg-gray-300'
            }`}
          >
            Subjects {stats && `(${stats.subjects})`}
          </button>
          <button
            onClick={() => setActiveSection('teachers')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeSection === 'teachers'
                ? 'bg-gray-800 text-white font-semibold'
                : 'hover:bg-gray-300'
            }`}
          >
            Teachers {stats && `(${stats.teachers})`}
          </button>
          <button
            onClick={() => setActiveSection('classrooms')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeSection === 'classrooms'
                ? 'bg-gray-800 text-white font-semibold'
                : 'hover:bg-gray-300'
            }`}
          >
            Classrooms {stats && `(${stats.classrooms})`}
          </button>
          <button
            onClick={() => setActiveSection('batches')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeSection === 'batches'
                ? 'bg-gray-800 text-white font-semibold'
                : 'hover:bg-gray-300'
            }`}
          >
            Batches {stats && `(${stats.batches})`}
          </button>
          <button
            onClick={() => setActiveSection('timetables')}
            className={`w-full text-left px-4 py-2 rounded ${
              activeSection === 'timetables'
                ? 'bg-gray-800 text-white font-semibold'
                : 'hover:bg-gray-300'
            }`}
          >
            Timetables {stats && `(${stats.timetables})`}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : activeSection === 'dashboard' ? (
          <div>
            <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Teachers</div>
                <div className="text-3xl font-bold text-blue-600">{stats?.teachers || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Subjects</div>
                <div className="text-3xl font-bold text-green-600">{stats?.subjects || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Classrooms</div>
                <div className="text-3xl font-bold text-purple-600">{stats?.classrooms || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Batches</div>
                <div className="text-3xl font-bold text-orange-600">{stats?.batches || 0}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Generate Timetable</h3>
              <p className="text-gray-700 mb-4">
                Create a new conflict-free timetable using the DSA algorithm engine.
              </p>
              <Button
                onClick={() => setActiveSection('timetables')}
                disabled={
                  !stats ||
                  stats.subjects === 0 ||
                  stats.teachers === 0 ||
                  stats.classrooms === 0 ||
                  stats.batches === 0
                }
              >
                Go to Timetables
              </Button>
              {stats &&
                (stats.subjects === 0 ||
                  stats.teachers === 0 ||
                  stats.classrooms === 0 ||
                  stats.batches === 0) && (
                  <p className="text-sm text-red-600 mt-2">
                    Please add teachers, subjects, classrooms, and batches first.
                  </p>
                )}
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg border border-gray-300">
              <h3 className="text-lg font-semibold mb-3">About Amdraipt</h3>
              <p className="text-gray-700 leading-relaxed">
                Amdraipt is an AI-driven timetable generation system powered by DSA algorithms.
                It uses a 4-phase hybrid algorithm combining Graph Coloring, Priority Queues,
                and Constraint Propagation to generate balanced, conflict-free timetables within
                seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h2 className="text-2xl font-bold mb-4 capitalize">{activeSection}</h2>
            <p className="text-gray-600">
              {activeSection} management interface will be implemented here.
              The backend API is fully functional and ready to integrate.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-gray-700">
                <strong>API Endpoints available:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• GET /api/{activeSection}</li>
                <li>• POST /api/{activeSection}</li>
                <li>• PUT /api/{activeSection}/[id]</li>
                <li>• DELETE /api/{activeSection}/[id]</li>
                {activeSection === 'timetables' && (
                  <li>• POST /api/timetables/generate</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
