const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestProduct() {
  try {
    // Get category ID
    const category = await prisma.category.findFirst({
      where: { name: 'Logam Mulia' },
    });

    if (!category) {
      console.log('Category not found');
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: 'Cincin Emas 24K',
        slug: 'cincin-emas-24k',
        description: 'Cincin emas murni 24 karat dengan desain elegan',
        price: 2500000,
        weightGram: 5,
        kadar: '24K',
        stock: 10,
        categoryId: category.id,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: true,
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    console.log('Product created successfully:', product);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProduct();
