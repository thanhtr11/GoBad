import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.matchScore.deleteMany();
  await prisma.match.deleteMany();
  await prisma.matchSummary.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.tournamentMember.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.statistic.deleteMany();
  await prisma.finance.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@gobad.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'player1@gobad.com',
      password: hashedPassword,
      name: 'Alice Johnson',
      role: 'MEMBER',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'player2@gobad.com',
      password: hashedPassword,
      name: 'Bob Smith',
      role: 'MEMBER',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      username: 'charlie',
      email: 'player3@gobad.com',
      password: hashedPassword,
      name: 'Charlie Brown',
      role: 'MEMBER',
    },
  });

  console.log('✅ Created 4 users');

  // Create clubs
  console.log('🏢 Creating clubs...');
  const club1 = await prisma.club.create({
    data: {
      name: 'Downtown Badminton Club',
      location: 'Downtown Sports Center',
      createdBy: admin.id,
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'Riverside Badminton Club',
      location: 'Riverside Sports Complex',
      createdBy: admin.id,
    },
  });

  console.log('✅ Created 2 clubs');

  // Create members
  console.log('👨‍🦰 Creating members...');
  const members = await Promise.all([
    prisma.member.create({
      data: {
        clubId: club1.id,
        userId: member1.id,
        name: 'Alice Johnson',
        skillLevel: 'ADVANCED',
        joinDate: new Date('2023-01-15'),
      },
    }),
    prisma.member.create({
      data: {
        clubId: club1.id,
        userId: member2.id,
        name: 'Bob Smith',
        skillLevel: 'INTERMEDIATE',
        joinDate: new Date('2023-02-20'),
      },
    }),
    prisma.member.create({
      data: {
        clubId: club1.id,
        userId: member3.id,
        name: 'Charlie Brown',
        skillLevel: 'BEGINNER',
        joinDate: new Date('2023-06-10'),
      },
    }),
    prisma.member.create({
      data: {
        clubId: club1.id,
        name: 'Diana Prince',
        skillLevel: 'ADVANCED',
        joinDate: new Date('2023-03-05'),
      },
    }),
    prisma.member.create({
      data: {
        clubId: club2.id,
        name: 'Eve Wilson',
        skillLevel: 'INTERMEDIATE',
        joinDate: new Date('2023-04-12'),
      },
    }),
  ]);

  console.log('✅ Created 5 members');

  // Create practices
  console.log('🏸 Creating practices...');
  const now = new Date();
  const practices = await Promise.all([
    prisma.practice.create({
      data: {
        clubId: club1.id,
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        court: 'Court A',
        startTime: '18:00',
        endTime: '20:00',
      },
    }),
    prisma.practice.create({
      data: {
        clubId: club1.id,
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        court: 'Court B',
        startTime: '19:00',
        endTime: '21:00',
      },
    }),
    prisma.practice.create({
      data: {
        clubId: club1.id,
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        court: 'Court A',
        startTime: '18:00',
        endTime: '20:00',
      },
    }),
  ]);

  console.log('✅ Created 3 practices');

  // Create matches for past practices
  console.log('🎾 Creating matches...');
  const matches = await Promise.all([
    // Practice 1 matches
    prisma.match.create({
      data: {
        practiceId: practices[0].id,
        player1Id: members[0].id,
        player2Id: members[1].id,
        score1: 21,
        score2: 18,
        matchType: 'SINGLES',
        status: 'COMPLETED',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practices[0].id,
        player1Id: members[2].id,
        player2Id: members[3].id,
        score1: 15,
        score2: 21,
        matchType: 'SINGLES',
        status: 'COMPLETED',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practices[0].id,
        player1Id: members[0].id,
        player2Id: members[3].id,
        score1: 20,
        score2: 19,
        matchType: 'SINGLES',
        status: 'COMPLETED',
      },
    }),
    // Practice 2 matches
    prisma.match.create({
      data: {
        practiceId: practices[1].id,
        player1Id: members[1].id,
        player2Id: members[2].id,
        score1: 12,
        score2: 21,
        matchType: 'SINGLES',
        status: 'COMPLETED',
      },
    }),
    prisma.match.create({
      data: {
        practiceId: practices[1].id,
        player1Id: members[0].id,
        player2Id: members[3].id,
        score1: 21,
        score2: 14,
        matchType: 'SINGLES',
        status: 'COMPLETED',
      },
    }),
  ]);

  console.log('✅ Created 5 matches');

  // Create match scores
  console.log('📊 Creating match scores...');
  await Promise.all(
    matches.map((match) =>
      prisma.matchScore.create({
        data: {
          matchId: match.id,
          playerId: match.player1Id,
          points: match.score1,
        },
      })
    )
  );

  await Promise.all(
    matches.map((match) =>
      prisma.matchScore.create({
        data: {
          matchId: match.id,
          playerId: match.player2Id,
          points: match.score2,
        },
      })
    )
  );

  console.log('✅ Created match scores');

  // Create statistics
  console.log('📈 Creating statistics...');
  const stats = await Promise.all([
    prisma.statistic.create({
      data: {
        memberId: members[0].id,
        matchesPlayed: 3,
        wins: 3,
        losses: 0,
        pointsFor: 62,
        pointsAgainst: 51,
      },
    }),
    prisma.statistic.create({
      data: {
        memberId: members[1].id,
        matchesPlayed: 3,
        wins: 1,
        losses: 2,
        pointsFor: 51,
        pointsAgainst: 54,
      },
    }),
    prisma.statistic.create({
      data: {
        memberId: members[2].id,
        matchesPlayed: 2,
        wins: 0,
        losses: 2,
        pointsFor: 27,
        pointsAgainst: 42,
      },
    }),
    prisma.statistic.create({
      data: {
        memberId: members[3].id,
        matchesPlayed: 3,
        wins: 1,
        losses: 2,
        pointsFor: 54,
        pointsAgainst: 60,
      },
    }),
  ]);

  console.log('✅ Created statistics');

  // Create attendance records
  console.log('📋 Creating attendance records...');
  await Promise.all([
    prisma.attendance.create({
      data: {
        memberId: members[0].id,
        practiceId: practices[0].id,
        checkInTime: new Date(practices[0].date.getTime() + 5 * 60 * 1000),
        checkOutTime: new Date(practices[0].date.getTime() + 2 * 60 * 60 * 1000),
      },
    }),
    prisma.attendance.create({
      data: {
        memberId: members[1].id,
        practiceId: practices[0].id,
        checkInTime: new Date(practices[0].date.getTime() + 10 * 60 * 1000),
        checkOutTime: new Date(practices[0].date.getTime() + 2 * 60 * 60 * 1000),
      },
    }),
    prisma.attendance.create({
      data: {
        memberId: members[2].id,
        practiceId: practices[0].id,
        checkInTime: new Date(practices[0].date.getTime() + 15 * 60 * 1000),
        checkOutTime: new Date(practices[0].date.getTime() + 1.5 * 60 * 60 * 1000),
      },
    }),
    prisma.attendance.create({
      data: {
        memberId: members[3].id,
        practiceId: practices[0].id,
        checkInTime: new Date(practices[0].date.getTime() + 5 * 60 * 1000),
        checkOutTime: new Date(practices[0].date.getTime() + 2 * 60 * 60 * 1000),
      },
    }),
    prisma.attendance.create({
      data: {
        memberId: members[0].id,
        practiceId: practices[1].id,
        checkInTime: new Date(practices[1].date.getTime() + 3 * 60 * 1000),
        checkOutTime: new Date(practices[1].date.getTime() + 2 * 60 * 60 * 1000),
      },
    }),
    prisma.attendance.create({
      data: {
        memberId: members[1].id,
        practiceId: practices[1].id,
        checkInTime: new Date(practices[1].date.getTime() + 8 * 60 * 1000),
        checkOutTime: new Date(practices[1].date.getTime() + 2 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Created attendance records');

  // Create tournaments
  console.log('🏆 Creating tournaments...');
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club1.id,
      name: 'Holiday Badminton Championship 2024',
      date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      format: 'KNOCKOUT',
      status: 'PLANNING',
    },
  });

  console.log('✅ Created 1 tournament');

  // Add members to tournament
  console.log('👥 Adding members to tournament...');
  await Promise.all([
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        memberId: members[0].id,
      },
    }),
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        memberId: members[1].id,
      },
    }),
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        memberId: members[3].id,
      },
    }),
  ]);

  console.log('✅ Added members to tournament');

  // Create financial transactions
  console.log('💰 Creating financial transactions...');
  await Promise.all([
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MEMBERSHIP_FEE',
        description: 'Monthly membership fee - Alice Johnson',
        amount: 50,
        type: 'INCOME',
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MEMBERSHIP_FEE',
        description: 'Monthly membership fee - Bob Smith',
        amount: 50,
        type: 'INCOME',
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'FACILITY_RENTAL',
        description: 'Court rental - December',
        amount: 500,
        type: 'EXPENSE',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'EQUIPMENT',
        description: 'Purchase of badminton shuttlecocks',
        amount: 120,
        type: 'EXPENSE',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'MEMBERSHIP_FEE',
        description: 'Monthly membership fee - Charlie Brown',
        amount: 50,
        type: 'INCOME',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.finance.create({
      data: {
        clubId: club1.id,
        category: 'TOURNAMENT_FEE',
        description: 'Tournament entry fee - Holiday Championship',
        amount: 200,
        type: 'EXPENSE',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Created financial transactions');

  // Create match summaries
  console.log('📝 Creating match summaries...');
  await Promise.all([
    prisma.matchSummary.create({
      data: {
        matchId: matches[0].id,
        winner: members[0].id,
        loser: members[1].id,
        keyStats: JSON.stringify({
          fastestShot: 'Alice - Smash at 68 km/h',
          longestRally: '23 shots',
          mostErrors: 'Bob - 8 errors',
        }),
      },
    }),
    prisma.matchSummary.create({
      data: {
        matchId: matches[1].id,
        winner: members[3].id,
        loser: members[2].id,
        keyStats: JSON.stringify({
          fastestShot: 'Diana - Drive at 65 km/h',
          longestRally: '15 shots',
          mostErrors: 'Charlie - 6 errors',
        }),
      },
    }),
  ]);

  console.log('✅ Created match summaries');

  console.log('\n✨ Database seed completed successfully!');
  console.log('\n📊 Test Data Summary:');
  console.log(`   • Users: 4 (1 super admin, 3 members)`);
  console.log(`   • Clubs: 2`);
  console.log(`   • Members: 5`);
  console.log(`   • Practices: 3 (2 past, 1 future)`);
  console.log(`   • Matches: 5`);
  console.log(`   • Attendance Records: 6`);
  console.log(`   • Tournaments: 1`);
  console.log(`   • Financial Transactions: 6`);
  console.log('\n🔐 Test Credentials:');
  console.log(`   Username: admin | Password: password123 (SUPER_ADMIN)`);
  console.log(`   Username: alice | Password: password123 (MEMBER)`);
  console.log(`   Username: bob   | Password: password123 (MEMBER)`);
  console.log(`   Username: charlie | Password: password123 (MEMBER)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
