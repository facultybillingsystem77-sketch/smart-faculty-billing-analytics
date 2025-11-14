import { db } from '../index';
import { semesters } from '../schema';

async function seedSemesters() {
  console.log('🌱 Seeding semesters...');

  const semesterData = [
    // Academic Year 2024-2025
    {
      year: '2024-2025',
      semesterNumber: 1,
      semesterName: 'Fall 2024',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-12-20'),
      isActive: true,
    },
    {
      year: '2024-2025',
      semesterNumber: 2,
      semesterName: 'Spring 2025',
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-05-20'),
      isActive: true,
    },
    {
      year: '2024-2025',
      semesterNumber: 3,
      semesterName: 'Summer 2025',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-08-15'),
      isActive: true,
    },
    // Academic Year 2023-2024
    {
      year: '2023-2024',
      semesterNumber: 1,
      semesterName: 'Fall 2023',
      startDate: new Date('2023-08-01'),
      endDate: new Date('2023-12-20'),
      isActive: false,
    },
    {
      year: '2023-2024',
      semesterNumber: 2,
      semesterName: 'Spring 2024',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-05-20'),
      isActive: false,
    },
    {
      year: '2023-2024',
      semesterNumber: 3,
      semesterName: 'Summer 2024',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-15'),
      isActive: false,
    },
    // Academic Year 2025-2026
    {
      year: '2025-2026',
      semesterNumber: 1,
      semesterName: 'Fall 2025',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-12-20'),
      isActive: false,
    },
    {
      year: '2025-2026',
      semesterNumber: 2,
      semesterName: 'Spring 2026',
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-05-20'),
      isActive: false,
    },
  ];

  try {
    for (const semester of semesterData) {
      await db.insert(semesters).values(semester);
    }
    console.log(`✅ Successfully seeded ${semesterData.length} semesters`);
  } catch (error) {
    console.error('❌ Error seeding semesters:', error);
    throw error;
  }
}

// Run seeder if executed directly
if (require.main === module) {
  seedSemesters()
    .then(() => {
      console.log('✅ Semester seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Semester seeding failed:', error);
      process.exit(1);
    });
}

export { seedSemesters };
