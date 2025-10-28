import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Timetable from '@/lib/models/Timetable'

export async function GET() {
  try {
    await connectDB()

    // Get timetables without full schedule for performance
    const timetables = await Timetable.find({})
      .select('-schedule')
      .sort({ generatedAt: -1 })

    return NextResponse.json({
      success: true,
      data: timetables,
    })
  } catch (error) {
    console.error('GET timetables error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
