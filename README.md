# Amdraipt - AI-Driven Timetable Generation System

**Adaptive Multi-Dimensional Resource Allocation and Intelligent Planning Tool**

Amdraipt is a next-generation timetable generation system powered by advanced DSA algorithms. It uses a 4-phase hybrid algorithmic engine combining **Graph Coloring**, **Priority Queues**, and **Constraint Propagation** to generate balanced, conflict-free timetables within seconds.

## Features

- **Smart Adaptive Scheduling**: Learns from constraints and adjusts allocations automatically
- **Conflict-Free Optimization**: Ensures zero overlap for teachers, rooms, and student batches
- **Dynamic Re-generation**: Updates timetables instantly when constraints change
- **Balanced Workload Distribution**: Prevents teacher overload and minimizes idle time gaps
- **Professional UI**: Responsive dashboard to view and manage schedules
- **Algorithmic Core**: Combines graph theory, greedy heuristics, and backtracking for scalability

## Tech Stack

### Backend
- **Next.js 14** (App Router) - Full-stack framework
- **MongoDB** with Mongoose - Database and ODM
- **TypeScript** - Type safety throughout

### Frontend
- **React 18** - UI components
- **Tailwind CSS** - Styling
- **Next.js API Routes** - RESTful API

### Algorithm
- **4-Phase Hybrid DSA Engine**:
  1. Preprocessing & Constraint Analysis
  2. Greedy Allocation with Priority Queue
  3. Backtracking Conflict Resolution
  4. Optimization & Balancing

## Project Structure

```
dsahackathon/
├── app/
│   ├── api/                    # API routes
│   │   ├── stats/             # Statistics endpoint
│   │   ├── subjects/          # Subject CRUD
│   │   ├── teachers/          # Teacher CRUD
│   │   ├── classrooms/        # Classroom CRUD
│   │   ├── batches/           # Batch CRUD
│   │   └── timetables/        # Timetable CRUD + Generation
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main dashboard
│   └── globals.css            # Global styles
├── lib/
│   ├── algorithms/            # DSA scheduling engine
│   │   ├── data-structures/   # PriorityQueue, ConstraintGraph
│   │   ├── preprocessor.ts    # Phase 1: Constraint analysis
│   │   ├── greedy-scheduler.ts # Phase 2: Greedy allocation
│   │   ├── backtrack-resolver.ts # Phase 3: Backtracking
│   │   ├── optimizer.ts       # Phase 4: Optimization
│   │   └── scheduler.ts       # Main orchestrator
│   ├── models/                # MongoDB models
│   │   ├── Teacher.ts
│   │   ├── Subject.ts
│   │   ├── Classroom.ts
│   │   ├── Batch.ts
│   │   └── Timetable.ts
│   ├── db/
│   │   └── connection.ts      # MongoDB connection
│   └── utils.ts               # Utility functions
├── components/
│   └── ui/                    # UI components
│       └── button.tsx
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB running locally or MongoDB Atlas account

### Installation

1. **Clone the repository** (if not already in the directory):
   ```bash
   cd dsahackathon
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   The `.env.local` file is already created with default values:
   ```env
   MONGODB_URI=mongodb://localhost:27017/amdraipt_db
   NODE_ENV=development
   ```

   If using **MongoDB Atlas**, update `MONGODB_URI` with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/amdraipt_db
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   ```
   http://localhost:3000
   ```

## Usage Guide

### 1. Set Up Entities

Before generating a timetable, add the following entities:

#### **Subjects**
- Navigate to "Subjects" section
- Add subjects with name, code, and color
- Example: Mathematics (MATH101), Physics (PHY201)

#### **Teachers**
- Navigate to "Teachers" section
- Add teachers with:
  - Name and email
  - Subjects they can teach
  - Max periods per day/week
  - Unavailable time slots (optional)

#### **Classrooms**
- Navigate to "Classrooms" section
- Add classrooms with:
  - Name (e.g., "Room 101")
  - Capacity (student count)
  - Type (lecture/lab/seminar/auditorium)
  - Facilities (optional)

#### **Batches**
- Navigate to "Batches" section
- Add student batches with:
  - Name (e.g., "CS Year 1 Section A")
  - Year and section
  - Student count
  - Subject period allocation (periods per week for each subject)

### 2. Generate Timetable

1. Navigate to "Timetables" section
2. Click "Generate New Timetable"
3. Enter timetable name
4. Select batches to include
5. Click "Generate"

The algorithm will:
- Analyze all constraints
- Build conflict graph
- Allocate periods using greedy heuristics
- Resolve conflicts with backtracking
- Optimize for balanced workload and minimal gaps

### 3. View Timetable

Once generated, view the timetable with:
- Grid layout (6 days × 6 periods)
- Filter by batch, teacher, or classroom
- Export to PDF (API endpoint available)

## API Endpoints

### Stats
- `GET /api/stats` - Get entity counts

### Subjects
- `GET /api/subjects` - List all subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/[id]` - Update subject
- `DELETE /api/subjects/[id]` - Delete subject

### Teachers
- `GET /api/teachers` - List all teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/[id]` - Update teacher
- `DELETE /api/teachers/[id]` - Delete teacher

### Classrooms
- `GET /api/classrooms` - List all classrooms
- `POST /api/classrooms` - Create classroom
- `PUT /api/classrooms/[id]` - Update classroom
- `DELETE /api/classrooms/[id]` - Delete classroom

### Batches
- `GET /api/batches` - List all batches
- `POST /api/batches` - Create batch
- `PUT /api/batches/[id]` - Update batch
- `DELETE /api/batches/[id]` - Delete batch

### Timetables
- `GET /api/timetables` - List all timetables (metadata only)
- `GET /api/timetables/[id]` - Get full timetable with schedule
- `POST /api/timetables/generate` - Generate new timetable
- `DELETE /api/timetables/[id]` - Delete timetable

## Algorithm Details

### Phase 1: Preprocessing
- Loads all entities from database
- Builds constraint graph (nodes = tasks, edges = conflicts)
- Calculates priority scores for tasks
- Pre-computes validity matrix (valid time slots for each task)

### Phase 2: Greedy Allocation
- Processes tasks from priority queue (most constrained first)
- Scores each valid slot using heuristics:
  - **Balance**: Prefer even teacher workload distribution
  - **Preference**: Bonus for teacher-preferred slots
  - **Gap penalty**: Avoid creating gaps in batch schedules
- Assigns tasks to best-scored slots
- Propagates constraints to remaining tasks

### Phase 3: Backtracking
- Handles tasks that couldn't be assigned greedily
- Tries all valid slots for unassigned tasks
- Attempts swaps with existing assignments if needed
- Uses constraint propagation to prune search space

### Phase 4: Optimization
- Calculates quality metrics (teacher variance, batch gaps)
- Applies local search optimization (random swaps)
- Accepts swaps that improve quality score
- Iterates up to 100 times or until no improvement

### Hard Constraints (Must Never Violate)
- Teacher cannot teach two classes simultaneously
- Classroom cannot host two classes simultaneously
- Batch cannot attend two classes simultaneously
- Teacher unavailable slots respected
- Teacher workload limits respected
- All required periods allocated

## Development

### Run in development mode:
```bash
npm run dev
```

### Build for production:
```bash
npm run build
npm start
```

### Lint code:
```bash
npm run lint
```

## Testing

Manual testing scenarios:
1. Create 3 subjects, 5 teachers, 5 classrooms, 2 batches
2. Assign subjects to teachers and batches
3. Generate timetable
4. Verify no conflicts (check each slot)
5. Verify all required periods allocated

## Future Enhancements

- Manual drag-and-drop timetable editing
- PDF export functionality
- CSV import for bulk data
- Authentication and multi-user support
- Advanced constraint preferences
- Analytics and reports
- Mobile application
- Calendar integration

## License

MIT

## Contributors

Built with DSA algorithms and intelligent planning.