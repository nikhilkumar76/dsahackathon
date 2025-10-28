import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Timetable from '@/lib/models/Timetable'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const id = params.id

    const timetable = await Timetable.findById(id)
      .populate('schedule.teacherId')
      .populate('schedule.subjectId')
      .populate('schedule.classroomId')
      .populate('schedule.batchId')

    if (!timetable) {
      return NextResponse.json(
        { success: false, error: 'Timetable not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: timetable,
    })
  } catch (error) {
    console.error('GET timetable error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const id = params.id

    const timetable = await Timetable.findByIdAndDelete(id)

    if (!timetable) {
      return NextResponse.json(
        { success: false, error: 'Timetable not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Timetable deleted successfully',
    })
  } catch (error) {
    console.error('DELETE timetable error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
