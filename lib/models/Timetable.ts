import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ScheduleEntry {
  day: number // 1-6
  period: number // 1-6
  teacherId: Types.ObjectId
  subjectId: Types.ObjectId
  classroomId: Types.ObjectId
  batchId: Types.ObjectId
}

export interface AlgorithmPhaseMetadata {
  preprocessing: number // milliseconds
  greedy: number
  backtracking: number
  optimization: number
}

export interface TimetableMetadata {
  executionTimeMs: number
  totalTasks: number
  conflictsResolved: number
  algorithmPhases: AlgorithmPhaseMetadata
}

export interface ITimetable extends Document {
  name: string
  generatedAt: Date
  status: 'draft' | 'active' | 'archived'
  schedule: ScheduleEntry[]
  metadata: TimetableMetadata
  createdAt: Date
  updatedAt: Date
}

const ScheduleEntrySchema = new Schema<ScheduleEntry>(
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
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
  },
  { _id: false }
)

const AlgorithmPhaseMetadataSchema = new Schema<AlgorithmPhaseMetadata>(
  {
    preprocessing: { type: Number, required: true },
    greedy: { type: Number, required: true },
    backtracking: { type: Number, required: true },
    optimization: { type: Number, required: true },
  },
  { _id: false }
)

const TimetableMetadataSchema = new Schema<TimetableMetadata>(
  {
    executionTimeMs: { type: Number, required: true },
    totalTasks: { type: Number, required: true },
    conflictsResolved: { type: Number, required: true },
    algorithmPhases: {
      type: AlgorithmPhaseMetadataSchema,
      required: true,
    },
  },
  { _id: false }
)

const TimetableSchema = new Schema<ITimetable>(
  {
    name: {
      type: String,
      required: [true, 'Timetable name is required'],
      trim: true,
      minlength: [2, 'Timetable name must be at least 2 characters'],
      maxlength: [100, 'Timetable name must not exceed 100 characters'],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'archived'],
        message: 'Status must be one of: draft, active, archived',
      },
      default: 'draft',
    },
    schedule: {
      type: [ScheduleEntrySchema],
      default: [],
    },
    metadata: {
      type: TimetableMetadataSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in development
const Timetable: Model<ITimetable> =
  mongoose.models.Timetable || mongoose.model<ITimetable>('Timetable', TimetableSchema)

export default Timetable
