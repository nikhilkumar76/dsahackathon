import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Subject from '@/lib/models/Subject'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    let query = {}
    if (search) {
      query = { name: { $regex: search, $options: 'i' } }
    }

    const subjects = await Subject.find(query).sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: subjects,
    })
  } catch (error) {
    console.error('GET subjects error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, code, color } = body

    // Validation
    const validationErrors = []

    if (!name || name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Subject name must be at least 2 characters',
      })
    }

    if (!code || code.trim().length === 0) {
      validationErrors.push({
        field: 'code',
        message: 'Subject code is required',
      })
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      validationErrors.push({
        field: 'color',
        message: 'Color must be a valid hex color code',
      })
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validationErrors,
        },
        { status: 400 }
      )
    }

    // Check uniqueness
    const codeUpper = code.toUpperCase()
    const existing = await Subject.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
        { code: codeUpper },
      ],
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Subject name or code already exists' },
        { status: 400 }
      )
    }

    const subject = new Subject({
      name: name.trim(),
      code: codeUpper,
      color: color || '#3B82F6',
    })

    await subject.save()

    return NextResponse.json(
      {
        success: true,
        data: subject,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST subject error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
