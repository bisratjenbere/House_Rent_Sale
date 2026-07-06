import type { SortOrder } from 'mongoose';
import { Category } from '@/models';
import type { PropertySearchQuery } from '@/types/property-search';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function buildPropertyFilter(query: PropertySearchQuery) {
  const filter: Record<string, unknown> = { status: 'published' };

  if (query.listingType) filter.listingType = query.listingType;
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.city) filter.city = { $regex: `^${escapeRegex(query.city)}`, $options: 'i' };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (query.minPrice !== undefined) price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) price.$lte = query.maxPrice;
    filter.price = price;
  }

  if (query.bedrooms !== undefined) filter.bedrooms = { $gte: query.bedrooms };
  if (query.bathrooms !== undefined) filter.bathrooms = { $gte: query.bathrooms };

  if (query.category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(query.category);
    if (isObjectId) {
      filter.category = query.category;
    } else {
      const cat = await Category.findOne({ slug: query.category }).select('_id');
      // No match → guaranteed zero results (don't silently drop the filter)
      filter.category = cat ? cat._id : '000000000000000000000000';
    }
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
}

export function buildSortStage(query: PropertySearchQuery): Record<string, SortOrder | { $meta: string }> {
  if (query.search) {
    return { score: { $meta: 'textScore' }, createdAt: -1 };
  }
  switch (query.sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'price-asc':
      return { price: 1, createdAt: -1 };
    case 'price-desc':
      return { price: -1, createdAt: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

export function applyCursor(
  filter: Record<string, unknown>,
  cursor?: string
): Record<string, unknown> {
  if (cursor) {
    filter._id = { $lt: cursor };
  }
  return filter;
}
