const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserActive() {
  try {
    console.log('Updating existing users to set isActive = true...');
    
    const result = await prisma.user.updateMany({
      where: {
        // Update all users (since isActive is a new field with default true)
      },
      data: {
        isActive: true,
      },
    });
    
    console.log(`Updated ${result.count} users`);
    
    // Verify the update
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
    
    console.log('Current users:');
    users.forEach(user => {
      console.log(`- ${user.email}: isActive = ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserActive();
