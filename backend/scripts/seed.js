/**
 * Database seed — rich demo catalogue.
 *   npm run seed
 *
 * Idempotent:
 *  - the 5 themed demo shops (by slug) are rebuilt on every run (DELETE + INSERT);
 *  - existing shops are only enriched with products that are missing (matched by name);
 *  - demo owners are created once (ON CONFLICT email DO NOTHING).
 *
 * Runs against whatever DATABASE_URL points to. For production (Neon), set
 * DATABASE_URL to the Neon URL + DATABASE_SSL=true before running.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../src/utils');

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

// Verified Unsplash photo IDs (all return 200), grouped loosely by theme.
const PIC = {
  tshirt: '1521572163474-6864f9cf17ab', jean: '1542272604-787c3835535d', dress: '1595777457583-95e059d581b8',
  jacket: '1551028719-00167b16eac5', sneaker: '1542291026-7eec264c27ff', boots: '1606107557195-0e29a4b5b4aa',
  bag: '1483985988355-763728e1935b', sunglasses: '1572635196237-14b3f281503f', watch: '1546868871-7041f2a55e12',
  scarf: '1520903920243-00d872a2d1c9',
  phone: '1511707171634-5f897ff02aa9', headphones: '1505740420928-5e560c06d30e', earbuds: '1590658268037-6bf12165a8df',
  laptop: '1496181133206-80ce9b88a853', smartwatch: '1523275335684-37898b6baf30', speaker: '1608043152269-423dbba4e7e1',
  keyboard: '1593642632823-8f785ba67e45', camera: '1517336714731-489689fd1ca8', charger: '1583863788434-e58a36330cf0',
  mouse: '1527814050087-3793815479db',
  lamp: '1513506003901-1e6a229e2d15', cushion: '1567538096630-e0c55bd6374c', plaid: '1586023492125-27b2c045efd7',
  vase: '1556228453-efd6c1ff04f6', candle: '1567538096630-e0c55bd6374c', mug: '1555041469-a586c61ea9bc',
  frame: '1560472354-b33ff0c44a43', plant: '1485955900006-10f4d324d411', rug: '1600166898405-da9535204843',
  clock: '1563861826100-9cb868fdbe1c',
  cream: '1556228720-195a672e8a03', serum: '1571781926291-c477ebfd024b', perfume: '1592945403244-b3fbafd7f539',
  lipstick: '1586495777744-4413f21062fa', palette: '1596462502278-27bfdc403348', oil: '1570172619644-dfd03ed5d881',
  mask: '1556228720-195a672e8a03', skincare: '1522312346375-d1a52e2b99b3',
  runshoe: '1542291026-7eec264c27ff', dumbbell: '1571019613454-1cb2f99b2d8b', yogamat: '1518611012118-696072aa579a',
  bottle: '1602143407151-7111542de6e8', sportbag: '1553062407-98eeb64c6a62', bands: '1598289431512-b97b0917affc',
  armband: '1581009146145-b5ef050c2e1e', techtee: '1576566588028-4147f3842f27',
};

const SHOPS = [
  {
    slug: 'atelier-mode', name: 'Atelier Mode',
    description: 'Mode contemporaine — vêtements, chaussures et accessoires soigneusement sélectionnés.',
    owner: { name: 'Camille Rousseau', email: 'camille.mode@boutiqueki.dev' },
    logo: img(PIC.bag), banner: img(PIC.jacket),
    theme: { primaryColor: '#1e293b', secondaryColor: '#db2777', font: 'Inter', layout: 'grid-3' },
    categories: [
      { name: 'Vêtements', slug: 'vetements' }, { name: 'Chaussures', slug: 'chaussures' }, { name: 'Accessoires', slug: 'accessoires' },
    ],
    products: [
      { name: 'T-shirt Premium Coton Bio', price: 29.9, compare: 39.9, cat: 'vetements', imgs: [PIC.tshirt, PIC.techtee], desc: '100% coton biologique, coupe moderne et confortable.', variants: [['S', 12], ['M', 20], ['L', 8], ['XL', 4]] },
      { name: 'Jean Slim Stretch', price: 59.9, compare: 79.9, cat: 'vetements', imgs: [PIC.jean], desc: 'Denim extensible, coupe slim intemporelle.', variants: [['38', 6], ['40', 10], ['42', 9]] },
      { name: 'Robe d’été Fleurie', price: 49.9, cat: 'vetements', imgs: [PIC.dress], desc: 'Légère et fluide, parfaite pour les beaux jours.', variants: [['S', 7], ['M', 5], ['L', 3]] },
      { name: 'Veste en Cuir', price: 149.9, compare: 199.9, cat: 'vetements', imgs: [PIC.jacket], desc: 'Cuir véritable, finition haut de gamme.', variants: [['M', 4], ['L', 2]] },
      { name: 'Sneakers Blanches', price: 79.9, cat: 'chaussures', imgs: [PIC.sneaker], desc: 'Baskets minimalistes en cuir.', variants: [['40', 8], ['41', 10], ['42', 12], ['43', 5]] },
      { name: 'Bottines Cuir', price: 109.9, compare: 139.9, cat: 'chaussures', imgs: [PIC.boots], desc: 'Bottines élégantes pour toutes saisons.', variants: [['39', 3], ['40', 6], ['41', 4]] },
      { name: 'Sac à main Cuir', price: 89.9, cat: 'accessoires', imgs: [PIC.bag], desc: 'Sac structuré, cuir grainé.', variants: [['Noir', 9], ['Camel', 6]] },
      { name: 'Lunettes de Soleil', price: 34.9, compare: 49.9, cat: 'accessoires', imgs: [PIC.sunglasses], desc: 'Protection UV400, monture légère.', variants: [['Standard', 25]] },
      { name: 'Montre Élégante', price: 129.9, cat: 'accessoires', imgs: [PIC.watch], desc: 'Mouvement quartz, bracelet acier.', variants: [['Argent', 5], ['Or', 3]] },
      { name: 'Écharpe en Laine', price: 24.9, cat: 'accessoires', imgs: [PIC.scarf], desc: 'Douce et chaude, laine mérinos.', variants: [['Gris', 14], ['Bordeaux', 11]] },
    ],
  },
  {
    slug: 'techsphere', name: 'TechSphère',
    description: 'High-tech et accessoires connectés — les dernières innovations à prix justes.',
    owner: { name: 'Yanis Bernard', email: 'yanis.tech@boutiqueki.dev' },
    logo: img(PIC.phone), banner: img(PIC.laptop),
    theme: { primaryColor: '#0f172a', secondaryColor: '#2563eb', font: 'Inter', layout: 'grid-3' },
    categories: [
      { name: 'Smartphones', slug: 'smartphones' }, { name: 'Audio', slug: 'audio' }, { name: 'Ordinateurs', slug: 'ordinateurs' }, { name: 'Accessoires', slug: 'accessoires' },
    ],
    products: [
      { name: 'Smartphone Pro 5G', price: 699.0, compare: 799.0, cat: 'smartphones', imgs: [PIC.phone], desc: 'Écran OLED 6.5", triple capteur photo, 5G.', variants: [['128 Go', 7], ['256 Go', 4]] },
      { name: 'Casque Sans Fil ANC', price: 199.9, compare: 249.9, cat: 'audio', imgs: [PIC.headphones], desc: 'Réduction de bruit active, 30h d’autonomie.', variants: [['Noir', 10], ['Blanc', 6]] },
      { name: 'Écouteurs True Wireless', price: 89.9, cat: 'audio', imgs: [PIC.earbuds], desc: 'Compacts, son riche, boîtier de charge.', variants: [['Standard', 18]] },
      { name: 'Laptop Ultrabook 14"', price: 999.0, compare: 1199.0, cat: 'ordinateurs', imgs: [PIC.laptop], desc: 'Léger, SSD 512 Go, autonomie 12h.', variants: [['8 Go RAM', 5], ['16 Go RAM', 3]] },
      { name: 'Montre Connectée', price: 179.9, cat: 'accessoires', imgs: [PIC.smartwatch], desc: 'Suivi santé, GPS, étanche.', variants: [['Noir', 9], ['Argent', 7]] },
      { name: 'Enceinte Bluetooth', price: 59.9, compare: 79.9, cat: 'audio', imgs: [PIC.speaker], desc: 'Son 360°, résistante à l’eau.', variants: [['Standard', 15]] },
      { name: 'Clavier Mécanique', price: 109.9, cat: 'accessoires', imgs: [PIC.keyboard], desc: 'Switches tactiles, rétroéclairage RGB.', variants: [['AZERTY', 8]] },
      { name: 'Appareil Photo Hybride', price: 749.0, compare: 899.0, cat: 'accessoires', imgs: [PIC.camera], desc: 'Capteur APS-C, 24 Mpx, vidéo 4K.', variants: [['Boîtier nu', 3], ['Kit objectif', 2]] },
      { name: 'Chargeur Rapide 65W', price: 34.9, cat: 'accessoires', imgs: [PIC.charger], desc: 'USB-C, charge ultra-rapide multi-appareils.', variants: [['Standard', 30]] },
      { name: 'Souris Ergonomique', price: 39.9, cat: 'accessoires', imgs: [PIC.mouse], desc: 'Sans fil, design ergonomique silencieux.', variants: [['Standard', 22]] },
    ],
  },
  {
    slug: 'maison-cosy', name: 'Maison Cosy',
    description: 'Décoration et art de vivre — pour un intérieur chaleureux et tendance.',
    owner: { name: 'Léa Moreau', email: 'lea.maison@boutiqueki.dev' },
    logo: img(PIC.vase), banner: img(PIC.lamp),
    theme: { primaryColor: '#44403c', secondaryColor: '#b45309', font: 'Inter', layout: 'grid-3' },
    categories: [
      { name: 'Décoration', slug: 'decoration' }, { name: 'Luminaires', slug: 'luminaires' }, { name: 'Cuisine', slug: 'cuisine' }, { name: 'Textile', slug: 'textile' },
    ],
    products: [
      { name: 'Lampe Design Laiton', price: 79.9, compare: 99.9, cat: 'luminaires', imgs: [PIC.lamp], desc: 'Lampe à poser, finition laiton brossé.', variants: [['Standard', 8]] },
      { name: 'Coussin Velours', price: 24.9, cat: 'textile', imgs: [PIC.cushion], desc: 'Velours doux, 45x45 cm.', variants: [['Vert', 16], ['Moutarde', 12], ['Bleu', 9]] },
      { name: 'Plaid Douillet', price: 39.9, compare: 54.9, cat: 'textile', imgs: [PIC.plaid], desc: 'Maille épaisse et moelleuse.', variants: [['Beige', 10], ['Gris', 7]] },
      { name: 'Vase Céramique', price: 29.9, cat: 'decoration', imgs: [PIC.vase], desc: 'Vase artisanal fait main.', variants: [['Standard', 14]] },
      { name: 'Bougie Parfumée', price: 18.9, cat: 'decoration', imgs: [PIC.candle], desc: 'Cire de soja, senteur vanille-bois.', variants: [['Standard', 30]] },
      { name: 'Mug Artisanal', price: 14.9, cat: 'cuisine', imgs: [PIC.mug], desc: 'Grès émaillé, 35 cl.', variants: [['Terracotta', 20], ['Bleu', 18]] },
      { name: 'Cadre Photo Bois', price: 19.9, cat: 'decoration', imgs: [PIC.frame], desc: 'Bois massif, format A4.', variants: [['Standard', 25]] },
      { name: 'Plante Artificielle', price: 34.9, compare: 44.9, cat: 'decoration', imgs: [PIC.plant], desc: 'Réaliste, sans entretien.', variants: [['Standard', 11]] },
      { name: 'Tapis Berbère', price: 119.9, cat: 'textile', imgs: [PIC.rug], desc: 'Motifs géométriques, 160x230 cm.', variants: [['Standard', 4]] },
      { name: 'Horloge Murale', price: 44.9, cat: 'decoration', imgs: [PIC.clock], desc: 'Design scandinave silencieux.', variants: [['Standard', 9]] },
    ],
  },
  {
    slug: 'belle-beaute', name: 'Belle & Beauté',
    description: 'Soins, maquillage et parfums — révélez votre éclat naturel.',
    owner: { name: 'Inès Dubois', email: 'ines.beaute@boutiqueki.dev' },
    logo: img(PIC.cream), banner: img(PIC.palette),
    theme: { primaryColor: '#831843', secondaryColor: '#ec4899', font: 'Inter', layout: 'grid-3' },
    categories: [
      { name: 'Soins', slug: 'soins' }, { name: 'Maquillage', slug: 'maquillage' }, { name: 'Parfums', slug: 'parfums' },
    ],
    products: [
      { name: 'Crème Hydratante', price: 24.9, compare: 32.9, cat: 'soins', imgs: [PIC.cream], desc: 'Hydratation 24h, acide hyaluronique.', variants: [['50 ml', 20]] },
      { name: 'Sérum Éclat Vitamine C', price: 34.9, cat: 'soins', imgs: [PIC.serum], desc: 'Anti-oxydant, teint lumineux.', variants: [['30 ml', 15]] },
      { name: 'Parfum Floral', price: 59.9, compare: 74.9, cat: 'parfums', imgs: [PIC.perfume], desc: 'Notes de jasmin et pivoine.', variants: [['50 ml', 8], ['100 ml', 5]] },
      { name: 'Rouge à Lèvres Mat', price: 19.9, cat: 'maquillage', imgs: [PIC.lipstick], desc: 'Tenue longue durée, fini mat.', variants: [['Rouge', 18], ['Nude', 14], ['Framboise', 10]] },
      { name: 'Palette Fards à Paupières', price: 39.9, compare: 49.9, cat: 'maquillage', imgs: [PIC.palette], desc: '12 teintes nude et intenses.', variants: [['Standard', 12]] },
      { name: 'Huile Visage Nourrissante', price: 29.9, cat: 'soins', imgs: [PIC.oil], desc: 'Mélange d’huiles précieuses.', variants: [['30 ml', 9]] },
      { name: 'Masque Purifiant', price: 16.9, cat: 'soins', imgs: [PIC.mask], desc: 'Argile, peaux mixtes à grasses.', variants: [['Standard', 22]] },
      { name: 'Coffret Soin Découverte', price: 49.9, compare: 69.9, cat: 'soins', imgs: [PIC.skincare], desc: 'Routine complète en format découverte.', variants: [['Standard', 6]] },
    ],
  },
  {
    slug: 'sportzone', name: 'SportZone',
    description: 'Équipement et accessoires de sport — dépassez vos limites.',
    owner: { name: 'Hugo Martin', email: 'hugo.sport@boutiqueki.dev' },
    logo: img(PIC.dumbbell), banner: img(PIC.runshoe),
    theme: { primaryColor: '#14532d', secondaryColor: '#16a34a', font: 'Inter', layout: 'grid-3' },
    categories: [
      { name: 'Fitness', slug: 'fitness' }, { name: 'Running', slug: 'running' }, { name: 'Yoga', slug: 'yoga' }, { name: 'Accessoires', slug: 'accessoires' },
    ],
    products: [
      { name: 'Chaussures de Running', price: 99.9, compare: 129.9, cat: 'running', imgs: [PIC.runshoe], desc: 'Amorti réactif, légères et respirantes.', variants: [['41', 6], ['42', 9], ['43', 7], ['44', 4]] },
      { name: 'Haltères 2x5 kg', price: 44.9, cat: 'fitness', imgs: [PIC.dumbbell], desc: 'Revêtement néoprène anti-dérapant.', variants: [['Standard', 12]] },
      { name: 'Tapis de Yoga', price: 29.9, compare: 39.9, cat: 'yoga', imgs: [PIC.yogamat], desc: 'Antidérapant, 6 mm, sangle incluse.', variants: [['Violet', 14], ['Vert', 11]] },
      { name: 'Gourde Isotherme 750 ml', price: 24.9, cat: 'accessoires', imgs: [PIC.bottle], desc: 'Inox, garde froid 24h / chaud 12h.', variants: [['Noir', 20], ['Bleu', 16]] },
      { name: 'Sac de Sport', price: 39.9, cat: 'accessoires', imgs: [PIC.sportbag], desc: 'Compartiment chaussures, 40 L.', variants: [['Standard', 9]] },
      { name: 'Bandes Élastiques (set)', price: 19.9, compare: 27.9, cat: 'fitness', imgs: [PIC.bands], desc: '5 niveaux de résistance.', variants: [['Standard', 25]] },
      { name: 'Brassard Sport', price: 14.9, cat: 'running', imgs: [PIC.armband], desc: 'Maintien smartphone, réfléchissant.', variants: [['Standard', 18]] },
      { name: 'T-shirt Technique', price: 27.9, cat: 'fitness', imgs: [PIC.techtee], desc: 'Tissu respirant évacuant la transpiration.', variants: [['S', 10], ['M', 14], ['L', 9]] },
    ],
  },
];

const DEMO_SLUGS = SHOPS.map(s => s.slug);
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function ensureOwner(client, name, email) {
  const hash = await bcrypt.hash('password123', 10);
  await client.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'owner') ON CONFLICT (email) DO NOTHING`,
    [name, email, hash]
  );
  const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  return rows[0].id;
}

async function insertProduct(client, shopId, catId, p) {
  const sku = `${shopId.slice(0, 4)}-${slugify(p.name).slice(0, 18)}`;
  const pr = await client.query(
    `INSERT INTO products (shop_id, category_id, name, description, price, compare_price, sku, status, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8::jsonb) RETURNING id`,
    [shopId, catId, p.name, p.desc, p.price, p.compare || null, sku, JSON.stringify(p.imgs.map(img))]
  );
  const productId = pr.rows[0].id;
  for (const [vName, vStock] of p.variants) {
    await client.query(
      `INSERT INTO product_variants (product_id, name, sku, price, stock_qty, alert_threshold)
       VALUES ($1, $2, $3, NULL, $4, 5)`,
      [productId, vName, `${sku}-${slugify(vName)}`, vStock]
    );
  }
}

async function rebuildShop(client, shop) {
  const ownerId = await ensureOwner(client, shop.owner.name, shop.owner.email);
  await client.query('DELETE FROM shops WHERE slug = $1', [shop.slug]); // cascade -> categories/products/variants
  const sr = await client.query(
    `INSERT INTO shops (owner_id, name, slug, description, logo_url, banner_url, status, theme)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', $7::jsonb) RETURNING id`,
    [ownerId, shop.name, shop.slug, shop.description, shop.logo, shop.banner, JSON.stringify(shop.theme || {})]
  );
  const shopId = sr.rows[0].id;
  const catIds = {};
  for (const c of shop.categories) {
    const cr = await client.query(
      `INSERT INTO categories (shop_id, name, slug) VALUES ($1, $2, $3)
       ON CONFLICT (shop_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [shopId, c.name, c.slug]
    );
    catIds[c.slug] = cr.rows[0].id;
  }
  for (const p of shop.products) {
    await insertProduct(client, shopId, catIds[p.cat] || null, p);
  }
  return shop.products.length;
}

// Add a few products to each pre-existing shop, skipping any already present (by name).
const ENRICH = [
  { name: 'Carnet de Notes Premium', price: 12.9, cat: null, imgs: [PIC.frame], desc: 'Papier ivoire, couverture rigide.', variants: [['Standard', 30]] },
  { name: 'Gourde Inox', price: 19.9, compare: 26.9, cat: null, imgs: [PIC.bottle], desc: 'Sans BPA, 500 ml.', variants: [['Noir', 22], ['Blanc', 18]] },
  { name: 'Casquette Classique', price: 16.9, cat: null, imgs: [PIC.armband], desc: 'Coton, taille réglable.', variants: [['Standard', 25]] },
  { name: 'Mug à Emporter', price: 15.9, cat: null, imgs: [PIC.mug], desc: 'Double paroi isotherme, 40 cl.', variants: [['Standard', 20]] },
];

async function enrichExisting(client) {
  const { rows: shops } = await client.query(
    `SELECT id, name FROM shops WHERE slug <> ALL($1) AND status = 'active'`,
    [DEMO_SLUGS]
  );
  let added = 0;
  for (const shop of shops) {
    for (const p of ENRICH) {
      const ex = await client.query('SELECT 1 FROM products WHERE shop_id = $1 AND name = $2', [shop.id, p.name]);
      if (ex.rows.length) continue;
      await insertProduct(client, shop.id, null, p);
      added++;
    }
  }
  return added;
}

(async () => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    let total = 0;
    for (const shop of SHOPS) {
      const n = await rebuildShop(client, shop);
      total += n;
      console.log(`  ✓ ${shop.name} (${shop.slug}) — ${n} produits`);
    }
    const enriched = await enrichExisting(client);
    console.log(`  ✓ Boutiques existantes enrichies — ${enriched} produits ajoutés`);
    await client.query('COMMIT');

    const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM products WHERE status = 'active'");
    console.log(`\n✅ Seed terminé. ${total + enriched} produits ajoutés. Total actifs en base : ${rows[0].n}.`);
    console.log('   Vendeurs démo : mot de passe « password123 ».');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed échoué :', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.closePool();
  }
})();
