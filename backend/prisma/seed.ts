import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.attendance.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.finance.deleteMany();
  await prisma.clubManager.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@gobad.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@gobad.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'MANAGER',
    },
  });

  const member1User = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'player1@gobad.com',
      password: hashedPassword,
      name: 'Alice Johnson',
      role: 'MEMBER',
    },
  });

  const member2User = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'player2@gobad.com',
      password: hashedPassword,
      name: 'Bob Smith',
      role: 'MEMBER',
    },
  });

  const member3User = await prisma.user.create({
    data: {
      username: 'charlie',
      email: 'player3@gobad.com',
      password: hashedPassword,
      name: 'Charlie Brown',
      role: 'MEMBER',
    },
  });

  const guestUser = await prisma.user.create({
    data: {
      username: 'guest',
      email: 'guest@gobad.com',
      password: hashedPassword,
      name: 'Guest User',
      role: 'GUEST',
    },
  });

  console.log('✅ Created 6 users');

  // Create clubs
  console.log('🏢 Creating clubs...');
  const club1 = await prisma.club.create({
    data: {
      name: 'Downtown Badminton Club',
      location: 'Downtown Sports Center',
      contactName: 'John Manager',
      email: 'contact@downtown.com',
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'Riverside Badminton Club',
      location: 'Riverside Sports Complex',
      contactName: 'Jane Manager',
      email: 'contact@riverside.com',
    },
  });

  console.log('✅ Created 2 clubs');

  // Keep reference to unused club2
  void club2;

  // Assign manager to clubs
  console.log('👔 Assigning managers to clubs...');
  await prisma.clubManager.create({
    data: {
      userId: managerUser.id,
      clubId: club1.id,
    },
  });

  console.log('✅ Assigned managers to clubs');

  // Create club members
  console.log('👨‍🦰 Creating club members...');
  const member1 = await prisma.member.create({
    data: {
      clubId: club1.id,
      userId: member1User.id,
      status: 'ACTIVE',
      type: 'MEMBER',
    },
  });

  const member2 = await prisma.member.create({
    data: {
      clubId: club1.id,
      userId: member2User.id,
      status: 'ACTIVE',
      type: 'MEMBER',
    },
  });

  const member3 = await prisma.member.create({
    data: {
      clubId: club1.id,
      userId: member3User.id,
      status: 'ACTIVE',
      type: 'MEMBER',
    },
  });

  const guestMember = await prisma.member.create({
    data: {
      clubId: club1.id,
      userId: guestUser.id,
      status: 'ACTIVE',
      type: 'GUEST',
    },
  });

  console.log('✅ Created 4 club members');

  // Keep references to unused variables
  void superAdminUser;
  void guestMember;

  // Create practices
  console.log('🏸 Creating practices...');
  const now = new Date();
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const future2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const practice1 = await prisma.practice.create({
    data: {
      clubId: club1.id,
      date: past7Days,
      startTime: new Date(past7Days.setHours(18, 0, 0, 0)),
      endTime: new Date(past7Days.setHours(20, 0, 0, 0)),
      court: 'Court A',
      expectedParticipants: 8,
    },
  });

  const practice2 = await prisma.practice.create({
    data: {
      clubId: club1.id,
      date: past3Days,
      startTime: new Date(past3Days.setHours(19, 0, 0, 0)),
      endTime: new Date(past3Days.setHours(21, 0, 0, 0)),
      court: 'Court B',
      expectedParticipants: 8,
    },
  });

  await prisma.practice.create({
    data: {
      clubId: club1.id,
      date: future2Days,
      startTime: new Date(future2Days.setHours(18, 0, 0, 0)),
      endTime: new Date(future2Days.setHours(20, 0, 0, 0)),
      court: 'Court A',
      expectedParticipants: 8,
    },
  });

  console.log('✅ Created 3 practices');

  // Create matches for past practices
  console.log('🎾 Creating matches...');
  await Promise.all([
    prisma.match.create({
      data: {
        practiceId: practice1.id,
        player1Id: member1.id,
        player2Id: member2.id,
        matchType: 'SINGLES',
        score1: 21,
        score2: 18,
        court: 'Court A',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practice1.id,
        player1Id: member3.id,
        player2Id: member1.id,
        matchType: 'SINGLES',
        score1: 15,
        score2: 21,
        court: 'Court A',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practice1.id,
        player1Id: member2.id,
        player2Id: member3.id,
        matchType: 'SINGLES',
        score1: 20,
        score2: 19,
        court: 'Court A',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practice2.id,
        player1Id: member2.id,
        player2Id: member3.id,
        matchType: 'SINGLES',
        score1: 12,
        score2: 21,
        court: 'Court B',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practice2.id,
        player1Id: member1.id,
        player2Id: member2.id,
        matchType: 'SINGLES',
        score1: 21,
        score2: 14,
        court: 'Court B',
      },
    }),
  ]);

  console.log('✅ Created 5 matches');

  // Create attendance records
  console.log('📋 Creating attendance records...');
  await Promise.all([
    prisma.attendance.create({
      data: {
        practiceId: practice1.id,
        memberId: member1.id,
      },
    }),
    prisma.attendance.create({
      data: {
        practiceId: practice1.id,
        memberId: member2.id,
      },
    }),
    prisma.attendance.create({
      data: {
        practiceId: practice1.id,
        memberId: member3.id,
      },
    }),
    prisma.attendance.create({
      data: {
        practiceId: practice2.id,
        memberId: member1.id,
      },
    }),
    prisma.attendance.create({
      data: {
        practiceId: practice2.id,
        memberId: member2.id,
      },
    }),
  ]);

  console.log('✅ Created attendance records');

  // Create tournaments
  console.log('🏆 Creating tournaments...');
  const future30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const tournamentPractice = await prisma.practice.create({
    data: {
      clubId: club1.id,
      date: future30Days,
      startTime: new Date(future30Days.setHours(10, 0, 0, 0)),
      endTime: new Date(future30Days.setHours(18, 0, 0, 0)),
      court: 'Courts 1-4',
      expectedParticipants: 16,
      isTournament: true,
    },
  });

  await prisma.tournament.create({
    data: {
      clubId: club1.id,
      practiceId: tournamentPractice.id,
      name: 'Holiday Badminton Championship 2024',
      format: 'KNOCKOUT',
      status: 'UPCOMING',
    },
  });

  console.log('✅ Created 1 tournament');

  // Create financial transactions
  console.log('💰 Creating financial transactions...');
  await Promise.all([
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MEMBERSHIP_FEE',
        description: 'Monthly membership fee - Alice Johnson',
        amount: 500000,
        currency: 'VND',
        type: 'INCOME',
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MEMBERSHIP_FEE',
        description: 'Monthly membership fee - Bob Smith',
        amount: 500000,
        currency: 'VND',
        type: 'INCOME',
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'COURT_RENTAL',
        description: 'Court rental - December',
        amount: 5000000,
        currency: 'VND',
        type: 'EXPENSE',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'EQUIPMENT',
        description: 'Purchase of badminton shuttlecocks',
        amount: 1200000,
        currency: 'VND',
        type: 'EXPENSE',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MEMBERSHIP_FEE',
        description: 'Monthly membership fee - Charlie Brown',
        amount: 500000,
        currency: 'VND',
        type: 'INCOME',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MAINTENANCE',
        description: 'Court maintenance',
        amount: 2000000,
        currency: 'VND',
        type: 'EXPENSE',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Created financial transactions');

  console.log('\n✨ Database seed completed successfully!');
  console.log('\n📊 Test Data Summary:');
  console.log(`   • Users: 4 (1 admin, 3 members)`);
  console.log(`   • Clubs: 2`);
  console.log(`   • Members: 5`);
  console.log(`   • Practices: 3 (2 past, 1 future)`);
  console.log(`   • Matches: 5`);
  console.log(`   • Attendance Records: 6`);
  console.log(`   • Tournaments: 1`);
  console.log(`   • Financial Transactions: 6`);
  console.log('\n🔐 Test Credentials:');
  console.log(`   Username: admin`);
  console.log(`   Password: password123`);
  console.log(`   Username: alice`);
  console.log(`   Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
