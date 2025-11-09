import { db } from '@/db';
import { user } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@faculty.edu',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            name: 'Admin User',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
        },
        {
            email: 'john.smith@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. John Smith',
            createdAt: '2023-01-15T09:00:00.000Z',
            updatedAt: '2023-01-15T09:00:00.000Z',
        },
        {
            email: 'sarah.johnson@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Sarah Johnson',
            createdAt: '2023-02-20T10:00:00.000Z',
            updatedAt: '2023-02-20T10:00:00.000Z',
        },
        {
            email: 'michael.brown@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Prof. Michael Brown',
            createdAt: '2023-03-10T11:00:00.000Z',
            updatedAt: '2023-03-10T11:00:00.000Z',
        },
        {
            email: 'emily.davis@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Emily Davis',
            createdAt: '2023-04-05T08:30:00.000Z',
            updatedAt: '2023-04-05T08:30:00.000Z',
        },
        {
            email: 'robert.wilson@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Robert Wilson',
            createdAt: '2023-05-12T09:15:00.000Z',
            updatedAt: '2023-05-12T09:15:00.000Z',
        },
        {
            email: 'jennifer.martinez@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Prof. Jennifer Martinez',
            createdAt: '2023-06-18T10:30:00.000Z',
            updatedAt: '2023-06-18T10:30:00.000Z',
        },
        {
            email: 'david.anderson@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. David Anderson',
            createdAt: '2023-07-22T11:45:00.000Z',
            updatedAt: '2023-07-22T11:45:00.000Z',
        },
        {
            email: 'lisa.taylor@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Lisa Taylor',
            createdAt: '2023-08-08T08:00:00.000Z',
            updatedAt: '2023-08-08T08:00:00.000Z',
        },
        {
            email: 'james.thomas@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Prof. James Thomas',
            createdAt: '2023-09-14T09:30:00.000Z',
            updatedAt: '2023-09-14T09:30:00.000Z',
        },
        {
            email: 'patricia.moore@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Patricia Moore',
            createdAt: '2023-10-03T10:15:00.000Z',
            updatedAt: '2023-10-03T10:15:00.000Z',
        },
        {
            email: 'christopher.jackson@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Christopher Jackson',
            createdAt: '2023-11-11T11:00:00.000Z',
            updatedAt: '2023-11-11T11:00:00.000Z',
        },
        {
            email: 'mary.white@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Prof. Mary White',
            createdAt: '2023-12-05T08:45:00.000Z',
            updatedAt: '2023-12-05T08:45:00.000Z',
        },
        {
            email: 'daniel.harris@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Daniel Harris',
            createdAt: '2023-12-20T09:20:00.000Z',
            updatedAt: '2023-12-20T09:20:00.000Z',
        },
        {
            email: 'jessica.martin@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Dr. Jessica Martin',
            createdAt: '2024-01-08T10:00:00.000Z',
            updatedAt: '2024-01-08T10:00:00.000Z',
        },
        {
            email: 'matthew.thompson@faculty.edu',
            password: await bcrypt.hash('faculty123', 10),
            role: 'faculty',
            name: 'Prof. Matthew Thompson',
            createdAt: '2024-01-15T11:30:00.000Z',
            updatedAt: '2024-01-15T11:30:00.000Z',
        },
    ];

    await db.insert(user).values(sampleUsers);

    console.log('✅ User seeder completed successfully - 16 users created (1 admin, 15 faculty)');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});