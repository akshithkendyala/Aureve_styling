import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { MainCategory } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as MainCategory | undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';
    const searchQuery = searchParams.get('search') || undefined;

    const items = await Repository.getWardrobeItems(session.userId, {
      category,
      includeArchived,
      favoritesOnly,
      searchQuery,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Fetch wardrobe items error:', error);
    return NextResponse.json({ error: 'Failed to retrieve wardrobe' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Check if batch upload
    if (Array.isArray(body.items) && body.items.length > 0) {
      const validItems = body.items.filter(
        (i: any) => i.name && i.category && i.image_url && i.primary_color
      );

      if (validItems.length === 0) {
        return NextResponse.json(
          { error: 'No valid items with required fields found.' },
          { status: 400 }
        );
      }

      const createdItems = await Repository.addWardrobeItemsBatch(session.userId, validItems);
      return NextResponse.json({ success: true, items: createdItems, count: createdItems.length });
    }

    const {
      name,
      category,
      subcategory,
      image_url,
      primary_color,
      secondary_colors,
      pattern,
      material,
      fit,
      style,
      formality,
      season,
      is_favorite,
    } = body;

    if (!name || !category || !image_url || !primary_color) {
      return NextResponse.json(
        { error: 'Name, Category, Image, and Primary Color are required fields.' },
        { status: 400 }
      );
    }

    const createdItem = await Repository.addWardrobeItem(session.userId, {
      name: name.trim(),
      category,
      subcategory: subcategory || 'other',
      image_url,
      primary_color,
      secondary_colors: secondary_colors || [],
      pattern: pattern || 'Solid',
      material: material || 'Cotton',
      fit: fit || 'Regular',
      style: style || 'Smart Casual',
      formality: formality || 'Smart Casual',
      season: season || ['All-Season'],
      is_favorite: Boolean(is_favorite),
      is_archived: false,
    });

    return NextResponse.json({ success: true, item: createdItem });
  } catch (error) {
    console.error('Create wardrobe item error:', error);
    return NextResponse.json({ error: 'Failed to add item to wardrobe' }, { status: 500 });
  }
}
