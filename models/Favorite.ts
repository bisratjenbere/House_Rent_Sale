import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate favorites
FavoriteSchema.index({ user: 1, property: 1 }, { unique: true });

export default mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);
