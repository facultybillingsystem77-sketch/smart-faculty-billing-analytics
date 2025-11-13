import { db } from '@/db';
import { subjects } from '@/db/schema';

async function main() {
    const sampleSubjects = [
        // Artificial Intelligence & Data Science (5 subjects)
        {
            name: 'Machine Learning',
            department: 'Artificial Intelligence & Data Science',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Deep Learning',
            department: 'Artificial Intelligence & Data Science',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Data Mining',
            department: 'Artificial Intelligence & Data Science',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Natural Language Processing',
            department: 'Artificial Intelligence & Data Science',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Computer Vision',
            department: 'Artificial Intelligence & Data Science',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        // Mechatronics (5 subjects)
        {
            name: 'Robotics',
            department: 'Mechatronics',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Control Systems',
            department: 'Mechatronics',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Sensors & Actuators',
            department: 'Mechatronics',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Embedded Systems',
            department: 'Mechatronics',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Automation',
            department: 'Mechatronics',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        // Food Technology (5 subjects)
        {
            name: 'Food Chemistry',
            department: 'Food Technology',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Food Processing',
            department: 'Food Technology',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Food Safety',
            department: 'Food Technology',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Nutrition Science',
            department: 'Food Technology',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Quality Control',
            department: 'Food Technology',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        // Electrical Engineering (5 subjects)
        {
            name: 'Circuit Analysis',
            department: 'Electrical Engineering',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Power Systems',
            department: 'Electrical Engineering',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Digital Electronics',
            department: 'Electrical Engineering',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Signal Processing',
            department: 'Electrical Engineering',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Electromagnetics',
            department: 'Electrical Engineering',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        // Civil & Infrastructure (5 subjects)
        {
            name: 'Structural Engineering',
            department: 'Civil & Infrastructure',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Construction Management',
            department: 'Civil & Infrastructure',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Transportation Engineering',
            department: 'Civil & Infrastructure',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Hydraulics',
            department: 'Civil & Infrastructure',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            name: 'Building Materials',
            department: 'Civil & Infrastructure',
            isActive: 1,
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
    ];

    await db.insert(subjects).values(sampleSubjects);
    
    console.log('✅ Subjects seeder completed successfully - Created 25 subjects across 5 departments');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});