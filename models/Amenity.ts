import mongoose, { Document, Schema } from 'mongoose';

export interface IAmenity extends Document {
  name: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AmenitySchema = new Schema<IAmenity>(
  {
    name: {
      type: String,
      required: [true, 'Amenity name is required'],
      unique: true,
    },
    icon: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Amenity || mongoose.model<IAmenity>('Amenity', AmenitySchema);
