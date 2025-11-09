import { db } from '@/db';
import { faculty } from '@/db/schema';

async function main() {
    const sampleFaculty = [
        {
            userId: 2,
            employeeId: 'FAC001',
            department: 'Computer Science',
            designation: 'Professor',
            joiningDate: '2018-08-15',
            baseSalary: 95000,
            phone: '+1-555-0101',
            address: '123 University Ave, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 3,
            employeeId: 'FAC002',
            department: 'Computer Science',
            designation: 'Associate Professor',
            joiningDate: '2019-09-01',
            baseSalary: 72000,
            phone: '+1-555-0102',
            address: '456 Faculty St, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 4,
            employeeId: 'FAC003',
            department: 'Computer Science',
            designation: 'Assistant Professor',
            joiningDate: '2021-01-10',
            baseSalary: 52000,
            phone: '+1-555-0103',
            address: '789 Academic Blvd, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 5,
            employeeId: 'FAC004',
            department: 'Mathematics',
            designation: 'Professor',
            joiningDate: '2016-07-20',
            baseSalary: 105000,
            phone: '+1-555-0104',
            address: '234 Scholar Lane, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 6,
            employeeId: 'FAC005',
            department: 'Mathematics',
            designation: 'Associate Professor',
            joiningDate: '2020-02-15',
            baseSalary: 68000,
            phone: '+1-555-0105',
            address: '567 Education Dr, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 7,
            employeeId: 'FAC006',
            department: 'Mathematics',
            designation: 'Lecturer',
            joiningDate: '2022-08-01',
            baseSalary: 42000,
            phone: '+1-555-0106',
            address: '890 Teaching Way, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 8,
            employeeId: 'FAC007',
            department: 'Physics',
            designation: 'Professor',
            joiningDate: '2015-09-10',
            baseSalary: 110000,
            phone: '+1-555-0107',
            address: '123 Research Park, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 9,
            employeeId: 'FAC008',
            department: 'Physics',
            designation: 'Assistant Professor',
            joiningDate: '2020-11-05',
            baseSalary: 58000,
            phone: '+1-555-0108',
            address: '456 Science Circle, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 10,
            employeeId: 'FAC009',
            department: 'Physics',
            designation: 'Assistant Professor',
            joiningDate: '2021-06-12',
            baseSalary: 54000,
            phone: '+1-555-0109',
            address: '789 Laboratory St, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 11,
            employeeId: 'FAC010',
            department: 'Chemistry',
            designation: 'Associate Professor',
            joiningDate: '2018-03-20',
            baseSalary: 75000,
            phone: '+1-555-0110',
            address: '234 Chemistry Hall, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 12,
            employeeId: 'FAC011',
            department: 'Chemistry',
            designation: 'Associate Professor',
            joiningDate: '2019-05-18',
            baseSalary: 70000,
            phone: '+1-555-0111',
            address: '567 Molecular Ave, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 13,
            employeeId: 'FAC012',
            department: 'Chemistry',
            designation: 'Lecturer',
            joiningDate: '2023-01-08',
            baseSalary: 38000,
            phone: '+1-555-0112',
            address: '890 Compound Rd, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 14,
            employeeId: 'FAC013',
            department: 'Biology',
            designation: 'Assistant Professor',
            joiningDate: '2020-09-25',
            baseSalary: 56000,
            phone: '+1-555-0113',
            address: '123 Biology Building, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 15,
            employeeId: 'FAC014',
            department: 'Biology',
            designation: 'Assistant Professor',
            joiningDate: '2021-04-15',
            baseSalary: 50000,
            phone: '+1-555-0114',
            address: '456 Life Sciences Dr, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        },
        {
            userId: 16,
            employeeId: 'FAC015',
            department: 'Biology',
            designation: 'Lecturer',
            joiningDate: '2022-10-20',
            baseSalary: 40000,
            phone: '+1-555-0115',
            address: '789 Ecology Way, Campus City',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z'
        }
    ];

    await db.insert(faculty).values(sampleFaculty);
    
    console.log('✅ Faculty seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});