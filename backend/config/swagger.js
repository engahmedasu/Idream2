const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'iDream Portal API',
      version: '1.0.0',
      description: 'API documentation for iDream Portal - E-commerce platform with shop management',
      contact: {
        name: 'iDream Support',
        email: 'support@idreamegypt.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.idreamegypt.com/api'
          : 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.idreamegypt.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            role: {
              type: 'object',
              description: 'User role'
            },
            shop: {
              type: 'string',
              description: 'Associated shop ID'
            },
            isActive: {
              type: 'boolean',
              description: 'Account active status'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (optional if phone provided)'
            },
            phone: {
              type: 'string',
              description: 'User phone number (optional if email provided)'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              minLength: 6
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'phone', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              minLength: 8
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                },
                role: {
                  type: 'string'
                },
                shop: {
                  type: 'string'
                }
              }
            }
          }
        },
        Shop: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Shop ID'
            },
            name: {
              type: 'string',
              description: 'Shop name',
              example: 'My Shop'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Shop email address',
              example: 'shop@example.com'
            },
            mobile: {
              type: 'string',
              description: 'Shop mobile number',
              example: '01234567890'
            },
            whatsapp: {
              type: 'string',
              description: 'Shop WhatsApp number',
              example: '01234567890'
            },
            instagram: {
              type: 'string',
              description: 'Instagram URL or username',
              example: 'https://instagram.com/myshop'
            },
            facebook: {
              type: 'string',
              description: 'Facebook URL or username',
              example: 'https://facebook.com/myshop'
            },
            address: {
              type: 'string',
              description: 'Shop address',
              example: '123 Main Street, City'
            },
            image: {
              type: 'string',
              description: 'Shop image URL',
              example: '/uploads/shops/shop-image.jpg'
            },
            category: {
              type: 'object',
              description: 'Category object'
            },
            priority: {
              type: 'number',
              description: 'Display priority (higher numbers appear first)',
              example: 0,
              minimum: 0
            },
            shareLink: {
              type: 'string',
              description: 'Unique share link for the shop',
              example: 'shop-507f1f77bcf86cd799439011'
            },
            isActive: {
              type: 'boolean',
              description: 'Shop active status',
              example: false
            },
            isApproved: {
              type: 'boolean',
              description: 'Shop approval status',
              example: false
            },
            approvedBy: {
              type: 'string',
              description: 'User ID who approved the shop'
            },
            approvedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Approval date'
            },
            createdBy: {
              type: 'string',
              description: 'User ID who created the shop'
            },
            updatedBy: {
              type: 'string',
              description: 'User ID who last updated the shop'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        ShopRequest: {
          type: 'object',
          required: ['name', 'email', 'mobile', 'whatsapp', 'category'],
          properties: {
            name: {
              type: 'string',
              description: 'Shop name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Shop email address'
            },
            mobile: {
              type: 'string',
              description: 'Shop mobile number'
            },
            whatsapp: {
              type: 'string',
              description: 'Shop WhatsApp number'
            },
            instagram: {
              type: 'string',
              description: 'Instagram URL or username'
            },
            facebook: {
              type: 'string',
              description: 'Facebook URL or username'
            },
            address: {
              type: 'string',
              description: 'Shop address'
            },
            category: {
              type: 'string',
              description: 'Category ID'
            },
            priority: {
              type: 'number',
              description: 'Display priority (higher numbers appear first)',
              minimum: 0,
              default: 0
            },
            isActive: {
              type: 'boolean',
              description: 'Shop active status',
              default: false
            },
            isApproved: {
              type: 'boolean',
              description: 'Shop approval status (SuperAdmin only)',
              default: false
            },
            shopImage: {
              type: 'string',
              format: 'binary',
              description: 'Shop image file'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Shops',
        description: 'Shop management endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Categories',
        description: 'Category management endpoints'
      },
      {
        name: 'Cart',
        description: 'Shopping cart endpoints'
      },
      {
        name: 'Reviews',
        description: 'Product review endpoints'
      },
      {
        name: 'Roles',
        description: 'Role management endpoints'
      },
      {
        name: 'Permissions',
        description: 'Permission management endpoints'
      },
      {
        name: 'Reports',
        description: 'Report generation endpoints'
      },
      {
        name: 'Shares',
        description: 'Share tracking endpoints'
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../server.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

