import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface TimeSlot {
  day: number // 1-6 (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  period: number // 1-6
}

export interface ITeacher extends Document {
  name: string
  email?: string
  subjects: Types.ObjectId[]
  maxPeriodsPerDay: number
  maxPeriodsPerWeek: number
  unavailableSlots: TimeSlot[]
  preferredSlots: TimeSlot[]
  createdAt: Date
  updatedAt: Date
}

const TimeSlotSchema = new Schema<TimeSlot>(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
  },
  { _id: false }
)

const TeacherSchema = new Schema<ITeacher>(
  {
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
      minlength: [2, 'Teacher name must be at least 2 characters'],
      maxlength: [100, 'Teacher name must not exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true // Email is optional
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        },
        message: 'Invalid email format',
      },
    },
    subjects: {
      type: [Schema.Types.ObjectId],
      ref: 'Subject',
      default: [],
    },
    maxPeriodsPerDay: {
      type: Number,
      default: 6,
      min: [1, 'Max periods per day must be at least 1'],
      max: [6, 'Max periods per day cannot exceed 6'],
    },
    maxPeriodsPerWeek: {
      type: Number,
      default: 30,
      min: [1, 'Max periods per week must be at least 1'],
      max: [36, 'Max periods per week cannot exceed 36'],
    },
    unavailableSlots: {
      type: [TimeSlotSchema],
      default: [],
    },
    preferredSlots: {
      type: [TimeSlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in development
const Teacher: Model<ITeacher> =
  mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema)

export default Teacher
