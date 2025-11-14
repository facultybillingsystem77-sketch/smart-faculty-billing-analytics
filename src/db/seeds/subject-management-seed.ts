import { db } from '@/db';
import { semesters, subjects, facultySubjectMap, timetable } from '@/db/schema';

async function seedSubjectManagement() {
  console.log('🌱 Seeding subject management data...');

  try {
    // 1. Seed Semesters (4 semesters for 2024-2025)
    console.log('📚 Creating semesters...');
    const semesterData = [
      {
        year: '2024-2025',
        semesterNumber: 1,
        semesterName: 'Semester 1',
        startDate: '2024-08-01',
        endDate: '2024-12-31',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        year: '2024-2025',
        semesterNumber: 2,
        semesterName: 'Semester 2',
        startDate: '2025-01-01',
        endDate: '2025-05-31',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        year: '2024-2025',
        semesterNumber: 3,
        semesterName: 'Semester 3',
        startDate: '2024-08-01',
        endDate: '2024-12-31',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        year: '2024-2025',
        semesterNumber: 4,
        semesterName: 'Semester 4',
        startDate: '2025-01-01',
        endDate: '2025-05-31',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const createdSemesters = await db.insert(semesters).values(semesterData).returning();
    console.log(`✅ Created ${createdSemesters.length} semesters`);

    // 2. Seed Subjects (20 subjects across 5 departments)
    console.log('📖 Creating subjects...');
    const subjectData = [
      // AI & Data Science - Semester 1
      {
        name: 'Introduction to AI',
        subjectCode: 'AI101',
        department: 'Artificial Intelligence & Data Science',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[0].id,
        description: 'Fundamentals of artificial intelligence',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Machine Learning Lab',
        subjectCode: 'AI101L',
        department: 'Artificial Intelligence & Data Science',
        subjectType: 'Lab',
        credits: 1.0,
        hoursPerWeek: 2.0,
        semesterId: createdSemesters[0].id,
        description: 'Hands-on ML practice',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Data Structures',
        subjectCode: 'AI201',
        department: 'Artificial Intelligence & Data Science',
        subjectType: 'Theory',
        credits: 4.0,
        hoursPerWeek: 5.0,
        semesterId: createdSemesters[0].id,
        description: 'Data structures and algorithms',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Deep Learning',
        subjectCode: 'AI301',
        department: 'Artificial Intelligence & Data Science',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[1].id,
        description: 'Neural networks and deep learning',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Electrical Engineering - Semester 1 & 2
      {
        name: 'Circuit Analysis',
        subjectCode: 'EE101',
        department: 'Electrical Engineering',
        subjectType: 'Theory',
        credits: 4.0,
        hoursPerWeek: 5.0,
        semesterId: createdSemesters[0].id,
        description: 'DC and AC circuit analysis',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Electronics Lab',
        subjectCode: 'EE101L',
        department: 'Electrical Engineering',
        subjectType: 'Lab',
        credits: 1.0,
        hoursPerWeek: 2.0,
        semesterId: createdSemesters[0].id,
        description: 'Electronic components and measurements',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Power Systems',
        subjectCode: 'EE201',
        department: 'Electrical Engineering',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[1].id,
        description: 'Power generation and distribution',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Control Systems',
        subjectCode: 'EE301',
        department: 'Electrical Engineering',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[1].id,
        description: 'Feedback control systems',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Food Technology - Semester 1 & 2
      {
        name: 'Food Chemistry',
        subjectCode: 'FT101',
        department: 'Food Technology',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[0].id,
        description: 'Chemical composition of food',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Food Processing Lab',
        subjectCode: 'FT101L',
        department: 'Food Technology',
        subjectType: 'Lab',
        credits: 1.0,
        hoursPerWeek: 3.0,
        semesterId: createdSemesters[0].id,
        description: 'Food processing techniques',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Food Preservation',
        subjectCode: 'FT201',
        department: 'Food Technology',
        subjectType: 'Theory',
        credits: 4.0,
        hoursPerWeek: 5.0,
        semesterId: createdSemesters[1].id,
        description: 'Methods of food preservation',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Food Safety',
        subjectCode: 'FT301',
        department: 'Food Technology',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[2].id,
        description: 'Food safety and quality control',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Mechatronics - Semester 1 & 2
      {
        name: 'Robotics Fundamentals',
        subjectCode: 'MEC101',
        department: 'Mechatronics',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[0].id,
        description: 'Introduction to robotics',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Mechatronics Lab',
        subjectCode: 'MEC101L',
        department: 'Mechatronics',
        subjectType: 'Lab',
        credits: 1.0,
        hoursPerWeek: 2.0,
        semesterId: createdSemesters[0].id,
        description: 'Hands-on mechatronics systems',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Automation Systems',
        subjectCode: 'MEC201',
        department: 'Mechatronics',
        subjectType: 'Theory',
        credits: 4.0,
        hoursPerWeek: 5.0,
        semesterId: createdSemesters[1].id,
        description: 'Industrial automation',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Civil & Infrastructure - Semester 1 & 2
      {
        name: 'Structural Analysis',
        subjectCode: 'CE101',
        department: 'Civil & Infrastructure',
        subjectType: 'Theory',
        credits: 4.0,
        hoursPerWeek: 5.0,
        semesterId: createdSemesters[0].id,
        description: 'Analysis of structures',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Surveying Lab',
        subjectCode: 'CE101L',
        department: 'Civil & Infrastructure',
        subjectType: 'Lab',
        credits: 1.0,
        hoursPerWeek: 2.0,
        semesterId: createdSemesters[0].id,
        description: 'Land surveying techniques',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Transportation Engineering',
        subjectCode: 'CE201',
        department: 'Civil & Infrastructure',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[1].id,
        description: 'Highway and traffic engineering',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Construction Management',
        subjectCode: 'CE301',
        department: 'Civil & Infrastructure',
        subjectType: 'Practical',
        credits: 2.0,
        hoursPerWeek: 3.0,
        semesterId: createdSemesters[2].id,
        description: 'Project management in construction',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Geotechnical Engineering',
        subjectCode: 'CE401',
        department: 'Civil & Infrastructure',
        subjectType: 'Theory',
        credits: 3.0,
        hoursPerWeek: 4.0,
        semesterId: createdSemesters[3].id,
        description: 'Soil mechanics and foundation design',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const createdSubjects = await db.insert(subjects).values(subjectData).returning();
    console.log(`✅ Created ${createdSubjects.length} subjects`);

    // 3. Seed Faculty-Subject Mapping (with co-teaching examples)
    console.log('👥 Creating faculty-subject mappings...');
    
    // Note: Using hardcoded faculty IDs 1-15 from existing seed data
    const facultySubjectMappings = [
      // AI & DS subjects (Faculty 1-3)
      { facultyId: 1, subjectId: createdSubjects[0].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 2, subjectId: createdSubjects[0].id, semesterId: createdSemesters[0].id, role: 'co-teacher', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 3, subjectId: createdSubjects[1].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 1, subjectId: createdSubjects[2].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 2, subjectId: createdSubjects[3].id, semesterId: createdSemesters[1].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Electrical Engineering subjects (Faculty 4-6)
      { facultyId: 4, subjectId: createdSubjects[4].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 5, subjectId: createdSubjects[5].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 6, subjectId: createdSubjects[6].id, semesterId: createdSemesters[1].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 4, subjectId: createdSubjects[7].id, semesterId: createdSemesters[1].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Food Technology subjects (Faculty 7-9)
      { facultyId: 7, subjectId: createdSubjects[8].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 8, subjectId: createdSubjects[9].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 9, subjectId: createdSubjects[10].id, semesterId: createdSemesters[1].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 7, subjectId: createdSubjects[11].id, semesterId: createdSemesters[2].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Mechatronics subjects (Faculty 10-12)
      { facultyId: 10, subjectId: createdSubjects[12].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 11, subjectId: createdSubjects[13].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 12, subjectId: createdSubjects[14].id, semesterId: createdSemesters[1].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Civil & Infrastructure subjects (Faculty 13-15)
      { facultyId: 13, subjectId: createdSubjects[15].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 14, subjectId: createdSubjects[16].id, semesterId: createdSemesters[0].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 15, subjectId: createdSubjects[17].id, semesterId: createdSemesters[1].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 13, subjectId: createdSubjects[18].id, semesterId: createdSemesters[2].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 14, subjectId: createdSubjects[19].id, semesterId: createdSemesters[3].id, role: 'primary', assignedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    const createdMappings = await db.insert(facultySubjectMap).values(facultySubjectMappings).returning();
    console.log(`✅ Created ${createdMappings.length} faculty-subject mappings`);

    // 4. Seed Timetable Entries (sample schedule)
    console.log('📅 Creating timetable entries...');
    const timetableData = [
      // Monday
      { facultyId: 1, subjectId: createdSubjects[0].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', roomNumber: 'Room 101', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 1, subjectId: createdSubjects[2].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Monday', startTime: '11:00', endTime: '12:30', roomNumber: 'Room 101', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 4, subjectId: createdSubjects[4].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Monday', startTime: '14:00', endTime: '15:30', roomNumber: 'Room 201', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Tuesday
      { facultyId: 2, subjectId: createdSubjects[0].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '10:30', roomNumber: 'Room 102', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 3, subjectId: createdSubjects[1].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Tuesday', startTime: '11:00', endTime: '13:00', roomNumber: 'Lab 1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 7, subjectId: createdSubjects[8].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '15:30', roomNumber: 'Room 301', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Wednesday
      { facultyId: 5, subjectId: createdSubjects[5].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:30', roomNumber: 'Room 202', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 10, subjectId: createdSubjects[12].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Wednesday', startTime: '11:00', endTime: '12:30', roomNumber: 'Room 401', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 13, subjectId: createdSubjects[15].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '15:30', roomNumber: 'Room 501', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Thursday
      { facultyId: 8, subjectId: createdSubjects[9].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Thursday', startTime: '09:00', endTime: '11:00', roomNumber: 'Lab 2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 11, subjectId: createdSubjects[13].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Thursday', startTime: '11:30', endTime: '14:30', roomNumber: 'Lab 3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Friday
      { facultyId: 14, subjectId: createdSubjects[16].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Friday', startTime: '09:00', endTime: '11:00', roomNumber: 'Lab 4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { facultyId: 1, subjectId: createdSubjects[0].id, semesterId: createdSemesters[0].id, dayOfWeek: 'Friday', startTime: '14:00', endTime: '15:30', roomNumber: 'Room 101', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    const createdTimetable = await db.insert(timetable).values(timetableData).returning();
    console.log(`✅ Created ${createdTimetable.length} timetable entries`);

    console.log('🎉 Subject management seeding completed successfully!');
    console.log(`   - Semesters: ${createdSemesters.length}`);
    console.log(`   - Subjects: ${createdSubjects.length}`);
    console.log(`   - Faculty-Subject Mappings: ${createdMappings.length}`);
    console.log(`   - Timetable Entries: ${createdTimetable.length}`);

  } catch (error) {
    console.error('❌ Error seeding subject management data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSubjectManagement()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedSubjectManagement };