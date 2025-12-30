const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Page = require('../models/Page');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idream');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedPages = async () => {
  try {
    const pages = [
      {
        slug: 'terms-and-conditions',
        title: {
          en: 'Terms & Conditions',
          ar: 'الشروط والأحكام'
        },
        content: {
          en: '<h2>Terms & Conditions</h2><p>Please read these terms and conditions carefully before using our service.</p>',
          ar: '<h2>الشروط والأحكام</h2><p>يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدمتنا.</p>'
        },
        order: 1,
        isActive: true
      },
      {
        slug: 'privacy',
        title: {
          en: 'Privacy Policy',
          ar: 'سياسة الخصوصية'
        },
        content: {
          en: '<h2>Privacy Policy</h2><p>We respect your privacy and are committed to protecting your personal data.</p>',
          ar: '<h2>سياسة الخصوصية</h2><p>نحن نحترم خصوصيتك وملتزمون بحماية بياناتك الشخصية.</p>'
        },
        order: 2,
        isActive: true
      },
      {
        slug: 'contact-us',
        title: {
          en: 'Contact Us',
          ar: 'اتصل بنا'
        },
        content: {
          en: '<h2>Contact Us</h2><p>Get in touch with us for any inquiries or support.</p>',
          ar: '<h2>اتصل بنا</h2><p>تواصل معنا لأي استفسارات أو دعم.</p>'
        },
        order: 3,
        isActive: true
      },
      {
        slug: 'consult-an-expert',
        title: {
          en: 'Consult an Expert',
          ar: 'استشر خبير'
        },
        content: {
          en: '<h2>Consult an Expert</h2><p>Need expert advice? Our team is here to help you.</p>',
          ar: '<h2>استشر خبير</h2><p>تحتاج إلى نصيحة خبير؟ فريقنا هنا لمساعدتك.</p>'
        },
        order: 4,
        isActive: true
      },
      {
        slug: 'faq',
        title: {
          en: 'FAQ',
          ar: 'الأسئلة الشائعة'
        },
        content: {
          en: '<h2>Frequently Asked Questions</h2><p>Find answers to common questions about our service.</p>',
          ar: '<h2>الأسئلة الشائعة</h2><p>ابحث عن إجابات للأسئلة الشائعة حول خدمتنا.</p>'
        },
        order: 5,
        isActive: true
      }
    ];

    console.log('Seeding pages...');
    
    for (const pageData of pages) {
      const existingPage = await Page.findOne({ slug: pageData.slug });
      if (existingPage) {
        console.log(`Page "${pageData.slug}" already exists, skipping...`);
      } else {
        await Page.create(pageData);
        console.log(`Created page: ${pageData.slug}`);
      }
    }

    console.log('Pages seeding completed!');
  } catch (error) {
    console.error('Error seeding pages:', error);
  }
};

const run = async () => {
  await connectDB();
  await seedPages();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

run();

