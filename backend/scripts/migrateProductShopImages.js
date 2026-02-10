/**
 * Optional migration: backfill thumbnailUrl, mediumUrl, originalUrl for existing
 * products and shops that only have the legacy `image` field.
 *
 * - Finds products/shops with `image` set and no `thumbnailUrl`
 * - If the image file exists on disk, runs Sharp to generate thumb/medium/original WebP
 * - Updates the document and removes the old file (replaced by new structure)
 *
 * Run once after deploying the new media pipeline:
 *   node scripts/migrateProductShopImages.js
 *
 * Requires: MongoDB connected, Sharp installed, env/config for upload dir.
 */

const path = require('path');
const fs = require('fs').promises;

// Load env the same way as app (supports ENV_FILE)
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENV_FILE = process.env.ENV_FILE || (NODE_ENV === 'production' ? '.env.prod' : '.env.dev');
require('dotenv').config({ path: path.join(__dirname, '..', ENV_FILE) });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const config = require('../config/app');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { processImage } = require('../services/mediaProcessor');

const uploadDir = config.upload.uploadDir;

function imagePathToFsPath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const rel = imageUrl.replace(/^\/uploads\/?/, '').replace(/\\/g, path.sep);
  return path.join(uploadDir, rel);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function migrateProducts() {
  const products = await Product.find({
    image: { $exists: true, $ne: '' },
    $or: [{ thumbnailUrl: { $exists: false } }, { thumbnailUrl: '' }],
  }).select('_id image').lean();

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of products) {
    const fsPath = imagePathToFsPath(doc.image);
    if (!fsPath) {
      skipped++;
      console.log(`  Skip product ${doc._id}: no path`);
      continue;
    }
    const exists = await fileExists(fsPath);
    if (!exists) {
      skipped++;
      console.log(`  Skip product ${doc._id}: file not found ${doc.image}`);
      continue;
    }
    try {
      const urls = await processImage(fsPath, 'product', doc._id);
      await Product.updateOne(
        { _id: doc._id },
        {
          thumbnailUrl: urls.thumbnailUrl,
          mediumUrl: urls.mediumUrl,
          originalUrl: urls.originalUrl,
          image: urls.originalUrl,
        }
      );
      done++;
      if (done % 10 === 0) console.log(`  Products migrated: ${done}`);
    } catch (err) {
      failed++;
      console.error(`  Failed product ${doc._id}:`, err.message);
    }
  }

  return { done, skipped, failed, total: products.length };
}

async function migrateShops() {
  const shops = await Shop.find({
    image: { $exists: true, $ne: '' },
    $or: [{ thumbnailUrl: { $exists: false } }, { thumbnailUrl: '' }],
  }).select('_id image').lean();

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of shops) {
    const fsPath = imagePathToFsPath(doc.image);
    if (!fsPath) {
      skipped++;
      console.log(`  Skip shop ${doc._id}: no path`);
      continue;
    }
    const exists = await fileExists(fsPath);
    if (!exists) {
      skipped++;
      console.log(`  Skip shop ${doc._id}: file not found ${doc.image}`);
      continue;
    }
    try {
      const urls = await processImage(fsPath, 'shop', doc._id);
      await Shop.updateOne(
        { _id: doc._id },
        {
          thumbnailUrl: urls.thumbnailUrl,
          mediumUrl: urls.mediumUrl,
          originalUrl: urls.originalUrl,
          image: urls.originalUrl,
        }
      );
      done++;
      if (done % 10 === 0) console.log(`  Shops migrated: ${done}`);
    } catch (err) {
      failed++;
      console.error(`  Failed shop ${doc._id}:`, err.message);
    }
  }

  return { done, skipped, failed, total: shops.length };
}

async function run() {
  console.log('Migration: Product & Shop images → WebP thumb/medium/original');
  console.log('Upload dir:', uploadDir);

  try {
    await mongoose.connect(config.database.uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  try {
    console.log('\n--- Products ---');
    const productStats = await migrateProducts();
    console.log(
      `Products: ${productStats.done} migrated, ${productStats.skipped} skipped, ${productStats.failed} failed (total: ${productStats.total})`
    );

    console.log('\n--- Shops ---');
    const shopStats = await migrateShops();
    console.log(
      `Shops: ${shopStats.done} migrated, ${shopStats.skipped} skipped, ${shopStats.failed} failed (total: ${shopStats.total})`
    );

    console.log('\nDone.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

run();
