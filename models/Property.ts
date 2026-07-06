import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  propertyType: 'house' | 'apartment' | 'villa' | 'studio' | 'land' | 'commercial-unit';
  category: mongoose.Types.ObjectId;
  listingType: 'rent' | 'sale';
  price: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  parking: number;
  area: number;
  address: string;
  city: string;
  region: string;
  location?: {
    lat: number;
    lng: number;
  };
  amenities: mongoose.Types.ObjectId[];
  images: Array<{
    url: string;
    publicId: string;
  }>;
  featured: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'rented' | 'sold' | 'archived';
  rejectionReason?: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    propertyType: {
      type: String,
      enum: ['house', 'apartment', 'villa', 'studio', 'land', 'commercial-unit'],
      required: [true, 'Property type is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    listingType: {
      type: String,
      enum: ['rent', 'sale'],
      required: [true, 'Listing type is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: [0, 'Bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      default: 0,
      min: [0, 'Bathrooms cannot be negative'],
    },
    kitchens: {
      type: Number,
      default: 0,
      min: [0, 'Kitchens cannot be negative'],
    },
    parking: {
      type: Number,
      default: 0,
      min: [0, 'Parking cannot be negative'],
    },
    area: {
      type: Number,
      required: [true, 'Area is required'],
      min: [0, 'Area cannot be negative'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
    },
    location: {
      type: {
        lat: {
          type: Number,
          min: [-90, 'Latitude must be between -90 and 90'],
          max: [90, 'Latitude must be between -90 and 90'],
        },
        lng: {
          type: Number,
          min: [-180, 'Longitude must be between -180 and 180'],
          max: [180, 'Longitude must be between -180 and 180'],
        },
      },
      required: false,
      validate: {
        validator: function (v: { lat?: number; lng?: number } | undefined) {
          // If location is provided, both lat and lng must be present
          if (!v) return true;
          return (
            v.lat !== undefined &&
            v.lat !== null &&
            v.lng !== undefined &&
            v.lng !== null
          );
        },
        message: 'Both latitude and longitude must be provided if location is set',
      },
    },
    amenities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Amenity',
      },
    ],
    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
      validate: {
        validator: function (v: unknown[]) {
          return v.length <= 10;
        },
        message: 'Maximum 10 images allowed per property',
      },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'rejected', 'rented', 'sold', 'archived'],
      default: 'draft',
      required: true,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PropertySchema.index({ owner: 1, status: 1 });
PropertySchema.index({ status: 1, featured: 1, createdAt: -1 });
PropertySchema.index({ city: 1, status: 1 });
PropertySchema.index({ propertyType: 1, status: 1 });
PropertySchema.index({ category: 1, status: 1 });

// Text index for free-text search (D16)
PropertySchema.index(
  { title: 'text', description: 'text', city: 'text' },
  { weights: { title: 10, city: 5, description: 1 } }
);

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
