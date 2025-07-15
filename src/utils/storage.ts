import { ReviewCard } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'scc_review_cards';

// Helper function to validate UUID format
const isValidUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Transform database row to ReviewCard type
const transformDbRowToCard = (row: any): ReviewCard => ({
  id: row.id,
  businessName: row.business_name,
  category: row.category,
  type: row.type,
  description: row.description || '',
  location: row.location || '',
  slug: row.slug,
  logoUrl: row.logo_url || '',
  googleMapsUrl: row.google_maps_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Transform ReviewCard to database insert format
const transformCardToDbInsert = (card: ReviewCard) => {
  const baseData = {
    business_name: card.businessName,
    category: card.category,
    type: card.type,
    description: card.description || null,
    location: card.location || null,
    slug: card.slug,
    logo_url: card.logoUrl || null,
    google_maps_url: card.googleMapsUrl,
    created_at: card.createdAt || new Date().toISOString(),
    updated_at: card.updatedAt || new Date().toISOString()
  };

  // Only include id if it's a valid UUID, otherwise let Supabase generate one
  if (isValidUuid(card.id)) {
    return { id: card.id, ...baseData };
  }
  
  return baseData;
};

// Transform ReviewCard to database update format
const transformCardToDbUpdate = (card: ReviewCard) => ({
  business_name: card.businessName,
  category: card.category,
  type: card.type,
  description: card.description || null,
  location: card.location || null,
  slug: card.slug,
  logo_url: card.logoUrl || null,
  google_maps_url: card.googleMapsUrl,
  updated_at: new Date().toISOString()
});

export const storage = {
  // Local storage helper methods
  _getLocalCards(): ReviewCard[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  _saveLocalCards(cards: ReviewCard[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  _addLocalCard(card: ReviewCard): void {
    const cards = this._getLocalCards();
    cards.unshift(card);
    this._saveLocalCards(cards);
  },

  _updateLocalCard(updatedCard: ReviewCard): void {
    const cards = this._getLocalCards();
    const index = cards.findIndex(card => card.id === updatedCard.id);
    if (index !== -1) {
      cards[index] = updatedCard;
      this._saveLocalCards(cards);
    }
  },

  _deleteLocalCard(cardId: string): void {
    const cards = this._getLocalCards();
    const filteredCards = cards.filter(card => card.id !== cardId);
    this._saveLocalCards(filteredCards);
  },

  _getLocalCardBySlug(slug: string): ReviewCard | null {
    const cards = this._getLocalCards();
    return cards.find(card => card.slug === slug) || null;
  },

  async getCards(): Promise<ReviewCard[]> {
    try {
      // Always try Supabase first if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          console.log('Attempting to fetch cards from Supabase...');
          const { data, error } = await supabase
            .from('review_cards')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            return this._getLocalCards();
          }

          console.log(`Successfully fetched ${data?.length || 0} cards from Supabase`);
          const supabaseCards = (data || []).map(transformDbRowToCard);
          
          // Also sync with localStorage for offline access
          this._saveLocalCards(supabaseCards);
          
          return supabaseCards;
        } catch (supabaseError) {
          console.error('Supabase connection failed, using localStorage:', supabaseError);
          return this._getLocalCards();
        }
      } else {
        console.log('Supabase not configured, using localStorage');
        return this._getLocalCards();
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      return this._getLocalCards();
    }
  },

  async addCard(card: ReviewCard): Promise<boolean> {
    try {
      console.log('Adding card:', card.businessName);
      
      // Always save to localStorage first for immediate feedback
      this._addLocalCard(card);
      console.log('Card saved to localStorage');

      // Then try to sync with Supabase if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          console.log('Attempting to save card to Supabase...');
          const insertData = transformCardToDbInsert(card);
          console.log('Insert data:', insertData);
          
          const { data, error } = await supabase
            .from('review_cards')
            .insert([insertData])
            .select();

          if (error) {
            console.error('Error adding card to Supabase (keeping in localStorage):', error);
            // Card is already in localStorage, so return true
            return true;
          }
          
          console.log('Card successfully added to Supabase:', data);
          return true;
        } catch (supabaseError) {
          console.error('Supabase connection failed (keeping in localStorage):', supabaseError);
          // Card is already in localStorage, so return true
          return true;
        }
      } else {
        console.log('Supabase not configured, card saved to localStorage only');
        return true;
      }
    } catch (error) {
      console.error('Error adding card:', error);
      return false;
    }
  },

  async updateCard(updatedCard: ReviewCard): Promise<boolean> {
    try {
      console.log('Updating card:', updatedCard.businessName);
      
      // Always update localStorage first
      this._updateLocalCard(updatedCard);
      console.log('Card updated in localStorage');

      // Then try to sync with Supabase if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          console.log('Attempting to update card in Supabase...');
          const updateData = transformCardToDbUpdate(updatedCard);
          console.log('Update data:', updateData);
          
          const { data, error } = await supabase
            .from('review_cards')
            .update(updateData)
            .eq('id', updatedCard.id)
            .select();

          if (error) {
            console.error('Error updating card in Supabase (keeping localStorage changes):', error);
            // Card is already updated in localStorage
            return true;
          }
          
          console.log('Card successfully updated in Supabase:', data);
          return true;
        } catch (supabaseError) {
          console.error('Supabase connection failed (keeping localStorage changes):', supabaseError);
          // Card is already updated in localStorage
          return true;
        }
      } else {
        console.log('Supabase not configured, card updated in localStorage only');
        return true;
      }
    } catch (error) {
      console.error('Error updating card:', error);
      return false;
    }
  },

  async deleteCard(cardId: string): Promise<boolean> {
    try {
      console.log('Deleting card:', cardId);
      
      // Always delete from localStorage first
      this._deleteLocalCard(cardId);
      console.log('Card deleted from localStorage');

      // Then try to sync with Supabase if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          console.log('Attempting to delete card from Supabase...');
          const { error } = await supabase
            .from('review_cards')
            .delete()
            .eq('id', cardId);

          if (error) {
            console.error('Error deleting card from Supabase (keeping localStorage changes):', error);
            // Card is already deleted from localStorage
            return true;
          }
          
          console.log('Card successfully deleted from Supabase');
          return true;
        } catch (supabaseError) {
          console.error('Supabase connection failed (keeping localStorage changes):', supabaseError);
          // Card is already deleted from localStorage
          return true;
        }
      } else {
        console.log('Supabase not configured, card deleted from localStorage only');
        return true;
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  },

  async getCardBySlug(slug: string): Promise<ReviewCard | null> {
    try {
      console.log('Looking for card with slug:', slug);
      
      // Try Supabase first if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          console.log('Searching Supabase for card...');
          const { data, error } = await supabase
            .from('review_cards')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            return this._getLocalCardBySlug(slug);
          }

          if (data) {
            console.log('Card found in Supabase:', data.business_name);
            return transformDbRowToCard(data);
          }
          
          console.log('Card not found in Supabase, checking localStorage...');
          // If not found in Supabase, check localStorage
          return this._getLocalCardBySlug(slug);
        } catch (supabaseError) {
          console.error('Supabase connection failed, using localStorage:', supabaseError);
          return this._getLocalCardBySlug(slug);
        }
      } else {
        console.log('Supabase not configured, using localStorage');
        return this._getLocalCardBySlug(slug);
      }
    } catch (error) {
      console.error('Error loading card by slug:', error);
      return this._getLocalCardBySlug(slug);
    }
  },

  // Migration helper: Move data from localStorage to Supabase
  async migrateFromLocalStorage(): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase not configured, skipping migration');
      return;
    }

    try {
      // Test connection first before attempting migration
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('review_cards')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed, skipping migration:', testError);
        return;
      }

      const localCards = this._getLocalCards();
      if (localCards.length === 0) {
        console.log('No local cards to migrate');
        return;
      }

      console.log(`Starting migration of ${localCards.length} cards from localStorage to Supabase...`);

      let successCount = 0;
      let failCount = 0;

      for (const card of localCards) {
        try {
          // Check if card already exists in Supabase
          const { data: existingCard, error: checkError } = await supabase
            .from('review_cards')
            .select('id')
            .eq('slug', card.slug)
            .maybeSingle();

          if (checkError) {
            console.error(`Failed to check existing card: ${card.businessName}`, checkError);
            failCount++;
            continue;
          }

          if (existingCard) {
            console.log(`Card already exists in Supabase: ${card.businessName}`);
            successCount++;
            continue;
          }

          // Insert the card
          const { error } = await supabase
            .from('review_cards')
            .insert([transformCardToDbInsert(card)]);

          if (error) {
            console.error(`Failed to migrate card: ${card.businessName}`, error);
            failCount++;
          } else {
            console.log(`Successfully migrated card: ${card.businessName}`);
            successCount++;
          }
        } catch (cardError) {
          console.error(`Error migrating card: ${card.businessName}`, cardError);
          failCount++;
        }
      }

      console.log(`Migration completed: ${successCount} successful, ${failCount} failed`);

      // Only clear localStorage if all cards were successfully migrated
      if (failCount === 0) {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Migration successful - localStorage cleared');
      } else {
        console.log('Some cards failed to migrate - keeping localStorage as backup');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      console.log('Migration failed - keeping data in localStorage');
    }
  },

  // Sync method to ensure data consistency
  async syncData(): Promise<void> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.log('Supabase not configured, sync skipped');
        return;
      }

      console.log('Starting data sync...');
      const { data: supabaseCards, error } = await supabase
        .from('review_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error syncing data:', error);
        return;
      }

      const transformedSupabaseCards = (supabaseCards || []).map(transformDbRowToCard);
      
      // Update localStorage with latest Supabase data
      this._saveLocalCards(transformedSupabaseCards);
      
      console.log(`Data sync completed successfully - ${transformedSupabaseCards.length} cards synced`);
    } catch (error) {
      console.error('Error during data sync:', error);
    }
  }
};