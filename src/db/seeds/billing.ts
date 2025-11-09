import { db } from '@/db';
import { billing } from '@/db/schema';

async function main() {
    const months = ['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'];
    
    const facultyBaseSalaries = [
        { id: 1, salary: 95000 },
        { id: 2, salary: 72000 },
        { id: 3, salary: 52000 },
        { id: 4, salary: 105000 },
        { id: 5, salary: 68000 },
        { id: 6, salary: 42000 },
        { id: 7, salary: 110000 },
        { id: 8, salary: 58000 },
        { id: 9, salary: 54000 },
        { id: 10, salary: 75000 },
        { id: 11, salary: 70000 },
        { id: 12, salary: 38000 },
        { id: 13, salary: 56000 },
        { id: 14, salary: 50000 },
        { id: 15, salary: 40000 },
    ];

    const allowancesOptions = [5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000];
    const deductionsOptions = [2000, 3000, 4000, 5000, 6000, 7000, 8000];
    const lecturesOptions = [8, 10, 12, 14, 16, 18, 20];
    const labsOptions = [0, 2, 4, 6, 8, 10];
    const tutorialsOptions = [0, 2, 4, 6, 8];

    const statusDistribution = [
        ...Array(54).fill('paid'),
        ...Array(27).fill('processed'),
        ...Array(9).fill('pending')
    ];

    const billingRecords = [];
    let recordIndex = 0;

    for (const faculty of facultyBaseSalaries) {
        for (const month of months) {
            const allowances = allowancesOptions[recordIndex % allowancesOptions.length];
            const deductions = deductionsOptions[recordIndex % deductionsOptions.length];
            const netSalary = faculty.salary + allowances - deductions;

            const lectures = lecturesOptions[recordIndex % lecturesOptions.length];
            const labs = labsOptions[recordIndex % labsOptions.length];
            const tutorials = tutorialsOptions[recordIndex % tutorialsOptions.length];
            const workloadString = JSON.stringify({ lectures, labs, tutorials });

            const generatedAtDate = new Date(`${month}-01T09:00:00.000Z`);
            const generatedAt = generatedAtDate.toISOString();

            const status = statusDistribution[recordIndex];

            let paidAt = null;
            if (status === 'paid') {
                const paidDate = new Date(generatedAtDate);
                const daysToAdd = 5 + (recordIndex % 6);
                paidDate.setDate(paidDate.getDate() + daysToAdd);
                paidAt = paidDate.toISOString();
            }

            billingRecords.push({
                facultyId: faculty.id,
                month,
                baseSalary: faculty.salary,
                allowances,
                deductions,
                netSalary,
                workload: workloadString as any,
                status,
                generatedAt,
                paidAt,
                createdAt: generatedAt,
                updatedAt: generatedAt,
            });

            recordIndex++;
        }
    }

    await db.insert(billing).values(billingRecords);
    
    console.log('✅ Billing seeder completed successfully - Generated 90 billing records');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});