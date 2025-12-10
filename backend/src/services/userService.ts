import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * User service for user management operations
 */

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
    },
  });
}

export async function createUser(data: {
  username: string;
  email?: string;
  password: string;
  name?: string;
  phone?: string;
  skillLevel?: string;
  role?: string;
}) {
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      name: data.name || data.username, // Default to username if name not provided
      phone: data.phone,
      skillLevel: (data.skillLevel as any) || 'INTERMEDIATE',
      role: (data.role as any) || 'MEMBER',
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
    },
  });
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    name?: string;
    phone?: string;
    skillLevel?: string;
    role?: string;
  }
) {
  const updateData: any = {};
  
  if (data.email !== undefined) updateData.email = data.email;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.skillLevel !== undefined) updateData.skillLevel = data.skillLevel;
  if (data.role !== undefined) updateData.role = data.role;

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
    },
  });
}

export async function deleteUser(id: string) {
  // First delete all club memberships for this user
  await prisma.member.deleteMany({
    where: { userId: id },
  });

  // Then delete the user
  return prisma.user.delete({
    where: { id },
  });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
    },
  });
}

export async function resetPassword(id: string, newPassword: string) {
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  return prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
    },
  });
}
