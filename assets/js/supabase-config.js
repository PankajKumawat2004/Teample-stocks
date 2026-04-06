// Supabase Configuration
const SUPABASE_URL = 'https://skvikhtcuqwcylmgsupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdmlraHRjdXF3Y3lsbWdzdXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODYxMzYsImV4cCI6MjA5MTA2MjEzNn0.e3AvsIUFl_3atG6Amh6dSrsE3YkWG0WgFXJlU9ub11s';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== CATEGORIES ====================
async function getCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function getAllCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching all categories:', error);
        return [];
    }
}

async function addCategory(categoryName) {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .insert([{ name: categoryName, is_active: true }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
}

async function updateCategory(id, categoryName) {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .update({ name: categoryName })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

async function toggleCategoryStatus(id, isActive) {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .update({ is_active: isActive })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error toggling category status:', error);
        throw error;
    }
}

async function deleteCategory(id) {
    try {
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

// ==================== ITEMS ====================
async function getItems() {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .select(`
                *,
                categories (name)
            `)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching items:', error);
        return [];
    }
}

async function addItem(itemName, categoryId, initialQty) {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .insert([{ 
                name: itemName, 
                category_id: categoryId, 
                current_stock: initialQty || 0 
            }])
            .select(`
                *,
                categories (name)
            `);
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding item:', error);
        throw error;
    }
}

async function updateItem(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                categories (name)
            `);
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating item:', error);
        throw error;
    }
}

async function deleteItem(id) {
    try {
        const { error } = await supabaseClient
            .from('items')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
}

async function getItemByName(itemName) {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .select(`
                *,
                categories (name)
            `)
            .eq('name', itemName)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching item:', error);
        return null;
    }
}

// ==================== TRANSACTIONS ====================
async function getTransactions(itemId = null) {
    try {
        let query = supabaseClient
            .from('transactions')
            .select(`
                *,
                items (name, category_id, categories (name))
            `)
            .order('created_at', { ascending: true });
        
        if (itemId) {
            query = query.eq('item_id', itemId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

async function addStockIn(itemId, quantity, remark = '') {
    try {
        // First get current stock
        const { data: item, error: itemError } = await supabaseClient
            .from('items')
            .select('current_stock')
            .eq('id', itemId)
            .single();
        
        if (itemError) throw itemError;
        
        const newTotal = (item.current_stock || 0) + parseInt(quantity);
        
        // Add transaction
        const { data: transaction, error: transactionError } = await supabaseClient
            .from('transactions')
            .insert([{
                item_id: itemId,
                type: 'stock_in',
                quantity: parseInt(quantity),
                remark: remark || 'Stock added',
                running_total: newTotal
            }])
            .select(`
                *,
                items (name, category_id, categories (name))
            `);
        
        if (transactionError) throw transactionError;
        
        // Update item's current stock
        const { error: updateError } = await supabaseClient
            .from('items')
            .update({ current_stock: newTotal })
            .eq('id', itemId);
        
        if (updateError) throw updateError;
        
        return transaction[0];
    } catch (error) {
        console.error('Error adding stock in:', error);
        throw error;
    }
}

async function addStockOut(itemId, quantity, remark = '') {
    try {
        // First get current stock
        const { data: item, error: itemError } = await supabaseClient
            .from('items')
            .select('current_stock')
            .eq('id', itemId)
            .single();
        
        if (itemError) throw itemError;
        
        const newTotal = (item.current_stock || 0) - parseInt(quantity);
        
        // Add transaction
        const { data: transaction, error: transactionError } = await supabaseClient
            .from('transactions')
            .insert([{
                item_id: itemId,
                type: 'stock_out',
                quantity: parseInt(quantity),
                remark: remark || 'Stock removed',
                running_total: newTotal
            }])
            .select(`
                *,
                items (name, category_id, categories (name))
            `);
        
        if (transactionError) throw transactionError;
        
        // Update item's current stock
        const { error: updateError } = await supabaseClient
            .from('items')
            .update({ current_stock: newTotal })
            .eq('id', itemId);
        
        if (updateError) throw updateError;
        
        return transaction[0];
    } catch (error) {
        console.error('Error adding stock out:', error);
        throw error;
    }
}

// ==================== DASHBOARD STATS ====================
async function getDashboardStats() {
    try {
        // Get total categories
        const { count: totalCategories } = await supabaseClient
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        // Get total items
        const { count: totalItems } = await supabaseClient
            .from('items')
            .select('*', { count: 'exact', head: true });
        
        // Get total stock value
        const { data: items } = await supabaseClient
            .from('items')
            .select('current_stock');
        
        const totalStock = items ? items.reduce((sum, item) => sum + (item.current_stock || 0), 0) : 0;
        
        // Get today's transactions
        const today = new Date().toISOString().split('T')[0];
        const { count: todayTransactions } = await supabaseClient
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);
        
        return {
            totalCategories: totalCategories || 0,
            totalItems: totalItems || 0,
            totalStock: totalStock,
            todayTransactions: todayTransactions || 0
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            totalCategories: 0,
            totalItems: 0,
            totalStock: 0,
            todayTransactions: 0
        };
    }
}

// Export for use
window.SupabaseDB = {
    // Categories
    getCategories,
    getAllCategories,
    addCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
    
    // Items
    getItems,
    addItem,
    updateItem,
    deleteItem,
    getItemByName,
    
    // Transactions
    getTransactions,
    addStockIn,
    addStockOut,
    
    // Dashboard
    getDashboardStats
};

console.log('Supabase connected successfully!');
