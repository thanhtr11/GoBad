import { PrismaClient } from '@prisma/client';
import { jsPDF } from 'jspdf';

const prisma = new PrismaClient();

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
}

class ExportService {
  async generateFinancePDF(clubId: string, options: PDFOptions): Promise<Buffer> {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new Error('Club not found');

    const finances = await prisma.finance.findMany({
      where: { clubId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const pdf = new jsPDF() as any;
    let yPos = 20;

    pdf.setFontSize(16);
    pdf.text(options.title, 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.text(`Club: ${club.name}`, 20, yPos);
    yPos += 6;
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 12;

    const income = finances.filter((f) => f.type === 'INCOME').reduce((s, f) => s + Number(f.amount), 0);
    const expense = finances.filter((f) => f.type === 'EXPENSE').reduce((s, f) => s + Number(f.amount), 0);

    pdf.setFont(undefined, 'bold');
    pdf.text('Summary', 20, yPos);
    yPos += 6;

    pdf.setFont(undefined, 'normal');
    pdf.text(`Income: $${income.toFixed(2)}`, 20, yPos);
    yPos += 5;
    pdf.text(`Expenses: $${expense.toFixed(2)}`, 20, yPos);
    yPos += 5;
    pdf.text(`Balance: $${(income - expense).toFixed(2)}`, 20, yPos);

    return Buffer.from(pdf.output('arraybuffer'));
  }

  async generateAttendancePDF(
    clubId: string,
    startDate: Date,
    endDate: Date,
    options: PDFOptions
  ): Promise<Buffer> {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new Error('Club not found');

    const attendance = await prisma.attendance.findMany({
      where: {
        practice: { clubId },
        checkInAt: { gte: startDate, lte: endDate },
      },
      take: 100,
    });

    const pdf = new jsPDF() as any;
    let yPos = 20;

    pdf.setFontSize(16);
    pdf.text(options.title, 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.text(`Club: ${club.name}`, 20, yPos);
    yPos += 6;
    pdf.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, yPos);
    yPos += 12;

    const uniqueMembers = new Set(attendance.map((a) => a.memberId)).size;

    pdf.setFont(undefined, 'bold');
    pdf.text('Summary', 20, yPos);
    yPos += 6;

    pdf.setFont(undefined, 'normal');
    pdf.text(`Total Check-ins: ${attendance.length}`, 20, yPos);
    yPos += 5;
    pdf.text(`Unique Members: ${uniqueMembers}`, 20, yPos);

    return Buffer.from(pdf.output('arraybuffer'));
  }

  async generateMemberPDF(clubId: string, options: PDFOptions): Promise<Buffer> {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new Error('Club not found');

    const members = await prisma.member.findMany({
      where: { clubId },
      orderBy: { name: 'asc' },
      take: 100,
    });

    const pdf = new jsPDF() as any;
    let yPos = 20;

    pdf.setFontSize(16);
    pdf.text(options.title, 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.text(`Club: ${club.name}`, 20, yPos);
    yPos += 6;
    pdf.text(`Total Members: ${members.length}`, 20, yPos);
    yPos += 12;

    pdf.setFont(undefined, 'bold');
    pdf.text('Member List', 20, yPos);
    yPos += 8;

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    members.forEach((m) => {
      pdf.text(`• ${m.name} (${m.skillLevel})`, 25, yPos);
      yPos += 5;
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
    });

    return Buffer.from(pdf.output('arraybuffer'));
  }

  async generateMatchStatsPDF(clubId: string, options: PDFOptions): Promise<Buffer> {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new Error('Club not found');

    const stats = await (prisma as any).statistic.findMany({
      where: { member: { clubId } },
      include: { member: true },
      orderBy: { winRate: 'desc' },
      take: 50,
    });

    const pdf = new jsPDF() as any;
    let yPos = 20;

    pdf.setFontSize(16);
    pdf.text(options.title, 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.text(`Club: ${club.name}`, 20, yPos);
    yPos += 12;

    pdf.setFont(undefined, 'bold');
    pdf.text('Top Players', 20, yPos);
    yPos += 8;

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    (stats as any[]).forEach((stat) => {
      const total = Number(stat.wins) + Number(stat.losses);
      const rate = total > 0 ? ((Number(stat.wins) / total) * 100).toFixed(1) : '0';
      pdf.text(`• ${stat.member.name}: ${stat.wins}W-${stat.losses}L (${rate}%)`, 25, yPos);
      yPos += 5;
    });

    return Buffer.from(pdf.output('arraybuffer'));
  }

  async generateTournamentPDF(tournamentId: string, options: PDFOptions): Promise<Buffer> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { practice: { include: { club: true } } },
    });

    if (!tournament) throw new Error('Tournament not found');

    const pdf = new jsPDF() as any;
    let yPos = 20;

    pdf.setFontSize(16);
    pdf.text(options.title, 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.text(`Club: ${tournament.practice.club.name}`, 20, yPos);
    yPos += 6;
    pdf.text(`Format: ${tournament.format}`, 20, yPos);
    yPos += 6;
    pdf.text(`Status: ${tournament.status}`, 20, yPos);
    yPos += 6;
    pdf.text(`Date: ${new Date(tournament.createdAt).toLocaleDateString()}`, 20, yPos);

    return Buffer.from(pdf.output('arraybuffer'));
  }
}

export default new ExportService();
