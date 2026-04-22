import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.orderLine.deleteMany();
  await prisma.orderCheckout.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.profileFavoriteProduct.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.artisan.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.contentEntry.deleteMany();
  await prisma.homepageHero.deleteMany();
  await prisma.brandTicker.deleteMany();
  await prisma.promoBanner.deleteMany();
  await prisma.stats.deleteMany();
  await prisma.pressItem.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('Sendiaba2026!', 10);
  await prisma.user.create({
    data: {
      email: 'admin@sendiaba.com',
      password,
      displayName: 'Admin Sendiaba',
      role: UserRole.ADMIN,
    },
  });

  const artisans = await Promise.all(
    [
      {
        referenceCode: 'ART-3017',
        fullName: 'Ibrahima Gueye',
        craft: 'Maroquinier',
        city: 'Dakar',
        email: 'ibrahima@sendiaba.com',
      },
      {
        referenceCode: 'ART-3018',
        fullName: 'Fatouma Diabate',
        craft: 'Tisserande',
        city: 'Bamako',
        email: 'fatouma@sendiaba.com',
      },
      {
        referenceCode: 'ART-3021',
        fullName: 'Awa Ndiaye',
        craft: 'Ceramiste',
        city: 'Saint-Louis',
        email: 'awa@sendiaba.com',
      },
      {
        referenceCode: 'ART-3019',
        fullName: 'Moussa Kone',
        craft: 'Sculpteur',
        city: 'Abidjan',
        email: 'moussa@sendiaba.com',
      },
      {
        referenceCode: 'ART-3020',
        fullName: 'Seynabou Fall',
        craft: 'Bijoutiere',
        city: 'Thiès',
        email: 'seynabou@sendiaba.com',
      },
    ].map((artisan) => prisma.artisan.create({ data: artisan })),
  );

  const categories = await Promise.all(
    [
      { slug: 'maroquinerie', title: 'Maroquinerie' },
      { slug: 'maison', title: 'Maison' },
      { slug: 'decoration', title: 'Decoration' },
      { slug: 'coffrets', title: 'Coffrets' },
    ].map((category) => prisma.category.create({ data: category })),
  );

  await prisma.product.createMany({
    data: Array.from({ length: 12 }).map((_, index) => ({
      name: `Produit ${index + 1}`,
      price: 25 + index * 5,
      artisanId: artisans[index % artisans.length].id,
      categoryId: categories[index % categories.length].id,
      details: ['Fait main', 'Edition limitee'],
    })),
  });

  await prisma.homepageHero.create({
    data: {
      badge: 'Nouveaute',
      title: 'Decouvrez l artisanat africain',
      cta: 'Explorer la collection',
      backgroundImageUrl: 'https://cdn.sendiaba.com/home/hero.jpg',
    },
  });

  await prisma.brandTicker.create({
    data: { items: ['Livraison rapide', 'Paiement securise', 'Artisans verifies'] },
  });

  await prisma.promoBanner.create({
    data: {
      badge: 'Promo',
      title: 'Semaine artisanale',
      subtitle: '-20% sur une selection',
      cta: 'J en profite',
      targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remainingPieces: 120,
      backgroundImageUrl: 'https://cdn.sendiaba.com/home/promo.jpg',
      href: '/collections/new-arrivals',
    },
  });

  await prisma.stats.createMany({
    data: [
      { value: 500, suffix: '+', label: 'Produits', order: 1 },
      { value: 120, suffix: '+', label: 'Artisans', order: 2 },
      { value: 15, suffix: '', label: 'Pays', order: 3 },
    ],
  });

  await prisma.pressItem.createMany({
    data: [
      { name: 'Jeune Afrique', order: 1 },
      { name: 'Forbes Afrique', order: 2 },
      { name: 'Le Monde Afrique', order: 3 },
    ],
  });

  await prisma.contentEntry.createMany({
    data: [
      { key: 'home.manifesto.title', scope: 'home', label: 'Manifesto title', defaultValue: 'Le savoir-faire au coeur' },
      { key: 'artisans.header.title', scope: 'artisans', label: 'Artisans title', defaultValue: 'Nos artisans' },
      { key: 'cart.empty.message', scope: 'cart', label: 'Cart empty', defaultValue: 'Votre panier est vide' },
      { key: 'checkout.title', scope: 'checkout', label: 'Checkout title', defaultValue: 'Finaliser ma commande' },
      { key: 'category.subtitle', scope: 'category', label: 'Category subtitle', defaultValue: 'Selection artisanale' },
    ],
  });
}

main()
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
