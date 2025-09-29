const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Upsert users
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      email: 'customer1@example.com',
      phone: '0810000001',
      role: 'customer',
    },
  });

  const contractorUser = await prisma.user.upsert({
    where: { email: 'contractor1@example.com' },
    update: {},
    create: {
      email: 'contractor1@example.com',
      phone: '0810000002',
      role: 'contractor',
    },
  });

  // Upsert contractor profile for contractorUser
  const contractor = await prisma.contractor.upsert({
    where: { userId: contractorUser.id },
    update: {
      businessName: 'Alpha Builders Co., Ltd',
      experience: 8,
      successRate: 0.9,
      responseTime: 2,
    },
    create: {
      userId: contractorUser.id,
      businessName: 'Alpha Builders Co., Ltd',
      experience: 8,
      successRate: 0.9,
      responseTime: 2,
    },
  });

  // Find existing lead by customerId + serviceType, otherwise create
  let lead = await prisma.lead.findFirst({
    where: {
      customerId: customerUser.id,
      serviceType: 'renovation',
      status: 'new',
    },
  });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        customerId: customerUser.id,
        serviceType: 'renovation',
        description: 'Condo living room renovation with built-in cabinets',
        location: 'Bangkok',
        budgetMin: 100000,
        budgetMax: 200000,
        urgency: 'medium',
        status: 'new',
      },
    });
  }

  // Upsert job by unique leadId
  const job = await prisma.job.upsert({
    where: { leadId: lead.id },
    update: {
      contractorId: contractor.id,
      customerId: customerUser.id,
      status: 'InProgress',
    },
    create: {
      leadId: lead.id,
      contractorId: contractor.id,
      customerId: customerUser.id,
      status: 'Pending',
    },
  });

  // Reset milestones for this job and seed a few
  await prisma.milestone.deleteMany({ where: { jobId: job.id } });

  await prisma.milestone.createMany({
    data: [
      {
        jobId: job.id,
        title: 'Design & Planning',
        description: 'Design proposal, materials selection, planning',
        amount: 30000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'Pending',
      },
      {
        jobId: job.id,
        title: 'Construction Phase',
        description: 'Demolition, carpentry, electrical, painting',
        amount: 120000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Pending',
      },
      {
        jobId: job.id,
        title: 'Final Handover',
        description: 'Final inspection and handover',
        amount: 50000,
        dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        status: 'Pending',
      },
    ],
  });

  console.log('Seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
