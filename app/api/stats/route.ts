import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Teacher from '@/lib/models/Teacher'
import Subject from '@/lib/models/Subject'
import Classroom from '@/lib/models/Classroom'
import Batch from '@/lib/models/Batch'
import Timetable from '@/lib/models/Timetable'

export async function GET() {
  try {
    await connectDB()

    const [teachers, subjects, classrooms, batches, timetables] = await Promise.all([
      Teacher.countDocuments(),
      Subject.countDocuments(),
      Classroom.countDocuments(),
      Batch.countDocuments(),
      Timetable.countDocuments(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        teachers,
        subjects,
        classrooms,
        batches,
        timetables,
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
