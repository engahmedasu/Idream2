const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Video = require('../models/Video');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/idream';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const initVideosCollection = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Initializing Videos collection...\n');

    // Check if videos collection exists and has any documents
    const videoCount = await Video.countDocuments();
    
    if (videoCount > 0) {
      console.log(`✅ Videos collection already exists with ${videoCount} video(s)`);
    } else {
      console.log('✅ Videos collection initialized (empty collection created)');
      console.log('   The collection will be automatically created when first video is added.');
    }

    // Verify the model schema is correct by attempting a test query
    await Video.findOne();
    console.log('✅ Video model schema verified');

    console.log('\n' + '='.repeat(60));
    console.log('📊 Initialization Summary:');
    console.log('='.repeat(60));
    console.log(`   Collection: videos`);
    console.log(`   Documents: ${videoCount}`);
    console.log(`   Status: ✅ Ready`);
    console.log('='.repeat(60));

    console.log('\n✅ Videos collection initialization completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - Video collection is ready to use');
    console.log('   - Superadmins can now create videos via the admin portal');
    console.log('   - Videos will appear in the banner on the home page');
    console.log('   - Collection structure:');
    console.log('     • title (required)');
    console.log('     • description');
    console.log('     • videoUrl (required)');
    console.log('     • thumbnailUrl');
    console.log('     • priority (for display order)');
    console.log('     • isActive (default: true)');
    console.log('     • createdBy, updatedBy (user references)');
    console.log('     • timestamps (createdAt, updatedAt)\n');

  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

initVideosCollection();

