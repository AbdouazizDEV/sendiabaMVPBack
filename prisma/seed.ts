import { OrderStatus, PrismaClient, UserRole, UserStatus } from '@prisma/client';
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
      referenceCode: 'USR-0001',
      email: 'admin@sendiaba.com',
      password,
      displayName: 'Admin Sendiaba',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const aminata = await prisma.user.create({
    data: {
      referenceCode: 'USR-4012',
      email: 'aminata@sendiaba.com',
      password,
      displayName: 'Aminata Diallo',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-02-03T12:00:00.000Z'),
    },
  });

  await prisma.profile.create({
    data: {
      userId: aminata.id,
      phone: '+221770000000',
      city: 'Dakar',
      country: 'Senegal',
    },
  });

  await Promise.all(
    Array.from({ length: 8 }).map(() =>
      prisma.order.create({
        data: {
          userId: aminata.id,
          status: OrderStatus.DELIVERED,
        },
      }),
    ),
  );

  const artisans = await Promise.all(
    [
      {
        referenceCode: 'USR-3017',
        displayName: 'Ibrahima Gueye',
        craft: 'Maroquinier',
        city: 'Dakar',
        email: 'ibrahima@sendiaba.com',
      },
      {
        referenceCode: 'USR-2',
        displayName: 'Fatouma Diabaté',
        craft: "Tisserande d'Art",
        city: 'Ségou',
        email: 'fatouma@sendiaba.com',
        bio: "À travers son métier à tisser, Fatouma perpétue les motifs traditionnels du Mali.",
        photoUrl: 'https://cdn.sendiaba.com/artisans/a2.png',
      },
      {
        referenceCode: 'USR-3021',
        displayName: 'Awa Ndiaye',
        craft: 'Ceramiste',
        city: 'Saint-Louis',
        email: 'awa@sendiaba.com',
      },
      {
        referenceCode: 'USR-3019',
        displayName: 'Moussa Kone',
        craft: 'Sculpteur',
        city: 'Abidjan',
        email: 'moussa@sendiaba.com',
      },
      {
        referenceCode: 'USR-3020',
        displayName: 'Seynabou Fall',
        craft: 'Bijoutiere',
        city: 'Thiès',
        email: 'seynabou@sendiaba.com',
      },
    ].map((artisan) =>
      prisma.user.create({
        data: {
          referenceCode: artisan.referenceCode,
          email: artisan.email,
          password,
          displayName: artisan.displayName,
          role: UserRole.ARTISAN,
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              city: artisan.city,
              craft: artisan.craft,
              bio: artisan.bio ?? null,
              avatarUrl: artisan.photoUrl ?? null,
            },
          },
        },
      }),
    ),
  );

  const categories = await Promise.all(
    [
      { slug: 'maroquinerie', title: 'Maroquinerie' },
      { slug: 'maison', title: 'Maison' },
      { slug: 'decoration', title: 'Decoration' },
      { slug: 'coffrets', title: 'Coffrets' },
    ].map((category) => prisma.category.create({ data: category })),
  );

  const productNames = [
    'Sac Signature en Cuir',
    'Pochette Soirée Wax',
    'Panier Tressé Naturel',
    'Coussin Brodé Terre',
    'Bracelet Laiton Filigrane',
    'Vase Grès Émaillé',
    'Plaid Coton Bio',
    'Boîte à Bijoux Bois',
    'Tapis Laine Berbère',
    'Service Thé Céramique',
    'Lampe Raphia Tressé',
    'Coffret Découverte Artisan',
  ];

  for (let index = 0; index < 12; index++) {
    const code = `PRD-${index + 1}`;
    const base = {
      referenceCode: code,
      name: productNames[index] ?? `Produit ${index + 1}`,
      price: index === 0 ? 350 : 25 + index * 5,
      imageUrl:
        index === 0
          ? 'https://cdn.sendiaba.com/products/p1.png'
          : `https://cdn.sendiaba.com/products/p${index + 1}.png`,
      artisanId: artisans[index % artisans.length].id,
      categoryId: categories[index % categories.length].id,
      details: ['Fait main', 'Edition limitee'],
    };
    const data =
      index === 0
        ? { ...base, description: 'Un sac intemporel fabrique a la main.' }
        : index === 2
          ? {
              ...base,
              name: 'Portefeuille Héritage',
              tag: 'Nouveau',
              href: '/produit/p3',
            }
          : index === 10
            ? {
                ...base,
                name: 'Sculpture en Ébène',
                tag: 'Édition Limitée',
                href: '/produit/p11',
              }
            : base;
    await prisma.product.create({ data });
  }

  const aminataProfile = await prisma.profile.findUniqueOrThrow({
    where: { userId: aminata.id },
  });
  const fatouma = await prisma.user.findFirstOrThrow({
    where: { referenceCode: 'USR-2' },
  });
  await prisma.profile.update({
    where: { id: aminataProfile.id },
    data: { favoriteArtisanId: fatouma.id },
  });
  for (const code of ['PRD-1', 'PRD-7', 'PRD-12'] as const) {
    const prod = await prisma.product.findUniqueOrThrow({
      where: { referenceCode: code },
    });
    await prisma.profileFavoriteProduct.create({
      data: { profileId: aminataProfile.id, productId: prod.id },
    });
  }

  const demoCart = await prisma.cart.create({
    data: { userId: aminata.id },
  });
  const cartProduct = await prisma.product.findUniqueOrThrow({
    where: { referenceCode: 'PRD-1' },
  });
  await prisma.cartItem.create({
    data: {
      cartId: demoCart.id,
      productId: cartProduct.id,
      quantity: 2,
    },
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
      {
        key: 'home.hero.title',
        scope: 'home',
        label: 'Hero - Titre',
        defaultValue: "L'ame de l'artisanat africain.",
        overrideValue:
          'Le luxe artisanal africain signe par ses createurs.',
      },
      {
        key: 'home.newsletter.title',
        scope: 'home',
        label: 'Newsletter - Titre',
        defaultValue: "Rejoignez l'Atelier",
        overrideValue: null,
      },
      {
        key: 'home.newsletter.subtitle',
        scope: 'home',
        label: 'Newsletter - Sous-titre',
        defaultValue: 'Inscrivez-vous pour decouvrir en avant-premiere...',
        overrideValue: null,
      },
      {
        key: 'home.manifesto.title',
        scope: 'home',
        label: 'Manifesto title',
        defaultValue: 'Le savoir-faire au coeur',
        overrideValue: null,
      },
      {
        key: 'artisans.hero.badge',
        scope: 'artisans',
        label: 'Artisans hero badge',
        defaultValue: 'Nos Maitres Artisans',
        overrideValue: null,
      },
      {
        key: 'artisans.hero.title',
        scope: 'artisans',
        label: 'Artisans hero title',
        defaultValue: "Les Mains de l'Excellence",
        overrideValue: null,
      },
      {
        key: 'artisans.hero.subtitle',
        scope: 'artisans',
        label: 'Artisans hero subtitle',
        defaultValue: "Le vrai luxe n'est pas silencieux...",
        overrideValue: null,
      },
      {
        key: 'artisans.header.title',
        scope: 'artisans',
        label: 'Artisans title',
        defaultValue: 'Nos artisans',
        overrideValue: null,
      },
      {
        key: 'cart.page.title',
        scope: 'cart',
        label: 'Panier - Titre',
        defaultValue: 'Vos pieces selectionnees',
        overrideValue: null,
      },
      {
        key: 'cart.page.link',
        scope: 'cart',
        label: 'Panier - Lien continuer',
        defaultValue: 'Continuer les achats',
        overrideValue: null,
      },
      {
        key: 'cart.empty.title',
        scope: 'cart',
        label: 'Panier vide - Titre',
        defaultValue: 'Votre selection est vide',
        overrideValue: null,
      },
      {
        key: 'cart.empty.subtitle',
        scope: 'cart',
        label: 'Panier vide - Sous-titre',
        defaultValue: 'Decouvrez nos pieces d exception...',
        overrideValue: null,
      },
      {
        key: 'checkout.hero.badge',
        scope: 'checkout',
        label: 'Checkout hero badge',
        defaultValue: 'Paiement securise',
        overrideValue: null,
      },
      {
        key: 'checkout.hero.title',
        scope: 'checkout',
        label: 'Checkout hero title',
        defaultValue: 'Finalisez votre commande en toute serenite',
        overrideValue: null,
      },
      {
        key: 'checkout.hero.subtitle',
        scope: 'checkout',
        label: 'Checkout hero subtitle',
        defaultValue:
          'Renseignez vos informations de livraison et choisissez votre moyen de paiement...',
        overrideValue: null,
      },
      {
        key: 'checkout.title',
        scope: 'checkout',
        label: 'Checkout title',
        defaultValue: 'Finaliser ma commande',
        overrideValue: null,
      },
      {
        key: 'category.empty.title',
        scope: 'category',
        label: 'Category empty title',
        defaultValue: 'Aucune creation ne correspond a vos criteres.',
        overrideValue: null,
      },
      {
        key: 'category.empty.subtitle',
        scope: 'category',
        label: 'Category empty subtitle',
        defaultValue:
          'Essayez de modifier vos filtres pour voir plus de resultats.',
        overrideValue: null,
      },
      {
        key: 'category.subtitle',
        scope: 'category',
        label: 'Category subtitle',
        defaultValue: 'Selection artisanale',
        overrideValue: null,
      },
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
