import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Plus, Edit2, Eye, EyeOff, Trash2, Utensils, Check, AlertCircle, Loader2, Maximize2 } from 'lucide-react';
import { MenuItem } from '../../types';
import { validateAndNormalizeImageUrl } from '../../utils/imageUrl';
import { SmartImage } from '../common/SmartImage';
import { CompressedImageUploader } from '../common/CompressedImageUploader';
import { FoodImageModal } from '../common/FoodImageModal';

export const MenuManagement: React.FC = () => {
  const {
    currentOwner,
    categories,
    menuItems,
    addCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability
  } = useSaaS();

  const [newCatName, setNewCatName] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [fullScreenImageItem, setFullScreenImageItem] = useState<MenuItem | null>(null);

  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [deletingDishId, setDeletingDishId] = useState<string | null>(null);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [dishImageError, setDishImageError] = useState<string | null>(null);

  const [dishForm, setDishForm] = useState({
    name: '',
    category_id: '',
    description: '',
    price: 190,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    prep_time: 15,
    is_veg: true,
    is_popular: false,
    is_recommended: false,
    spicy_level: 1
  });

  if (!currentOwner) return null;

  const restCategories = categories.filter(c => c.restaurant_id === currentOwner.id);
  const restMenu = menuItems.filter(m => m.restaurant_id === currentOwner.id);
  const displayedMenu = selectedCatFilter === 'all'
    ? restMenu
    : restMenu.filter(m => m.category_id === selectedCatFilter);

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) return;

    setIsSavingCat(true);
    const success = await addCategory(cleanName);
    setIsSavingCat(false);
    if (success) {
      setNewCatName('');
      setShowCatModal(false);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    setDishImageError(null);
    setIsValidatingImage(true);

    let imageUrl = dishForm.image_url ? dishForm.image_url.trim() : '';
    if (imageUrl) {
      const res = await validateAndNormalizeImageUrl(imageUrl);
      if (!res.isValid) {
        setIsValidatingImage(false);
        setDishImageError(`Dish Image Error: ${res.error}`);
        return;
      }
      imageUrl = res.normalizedUrl;
    }

    let catId = dishForm.category_id || (restCategories[0]?.id || '');
    if (!catId && restCategories.length === 0) {
      // Auto-create a default category if none exists
      await addCategory('General');
      const freshCat = categories.find(c => c.restaurant_id === currentOwner.id);
      if (freshCat) catId = freshCat.id;
    }

    setIsSavingDish(true);
    try {
      let success = false;
      if (editingItem) {
        success = await updateMenuItem(editingItem.id, {
          name: dishForm.name.trim(),
          category_id: catId || undefined,
          description: dishForm.description.trim(),
          price: Number(dishForm.price),
          image_url: imageUrl,
          prep_time: Number(dishForm.prep_time) || 15,
          is_veg: dishForm.is_veg,
          is_popular: dishForm.is_popular,
          is_recommended: dishForm.is_recommended,
          spicy_level: Number(dishForm.spicy_level) || 0
        });
      } else {
        success = await addMenuItem({
          name: dishForm.name.trim(),
          category_id: catId,
          description: dishForm.description.trim(),
          price: Number(dishForm.price),
          image_url: imageUrl,
          prep_time: Number(dishForm.prep_time) || 15,
          is_veg: dishForm.is_veg,
          is_available: true,
          is_popular: dishForm.is_popular,
          is_recommended: dishForm.is_recommended,
          spicy_level: Number(dishForm.spicy_level) || 0,
          sort_order: restMenu.length + 1
        });
      }

      if (success) {
        setShowDishModal(false);
        setEditingItem(null);
      }
    } finally {
      setIsSavingDish(false);
      setIsValidatingImage(false);
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setDishForm({
      name: item.name,
      category_id: item.category_id || (restCategories[0]?.id || ''),
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      prep_time: item.prep_time,
      is_veg: item.is_veg,
      is_popular: item.is_popular,
      is_recommended: item.is_recommended,
      spicy_level: item.spicy_level
    });
    setShowDishModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Menu & Categories Management</h2>
          <p className="text-xs text-slate-400">Organize food items, prices, preparation time & availability</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add Category
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setDishForm({
                name: '',
                category_id: restCategories[0]?.id || '',
                description: '',
                price: 250,
                image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
                prep_time: 15,
                is_veg: true,
                is_popular: false,
                is_recommended: false,
                spicy_level: 1
              });
              setShowDishModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add New Dish
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setSelectedCatFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            selectedCatFilter === 'all'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          All Items ({restMenu.length})
        </button>

        {restCategories.map(cat => (
          <div key={cat.id} className="relative group shrink-0">
            <button
              onClick={() => setSelectedCatFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                selectedCatFilter === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300">
                {restMenu.filter(m => m.category_id === cat.id).length}
              </span>
            </button>
            <button
              title={`Delete Category ${cat.name}`}
              disabled={deletingCatId === cat.id}
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete category "${cat.name}" and all associated dishes?`)) {
                  setDeletingCatId(cat.id);
                  await deleteCategory(cat.id);
                  setDeletingCatId(null);
                  if (selectedCatFilter === cat.id) setSelectedCatFilter('all');
                }
              }}
              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white items-center justify-center text-xs shadow-md border border-slate-900 z-10 transition-transform active:scale-90"
            >
              {deletingCatId === cat.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : '×'}
            </button>
          </div>
        ))}
      </div>

      {/* Dishes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Dish</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Prep Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Availability</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedMenu.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Utensils className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                    <p className="font-semibold text-sm text-slate-300">No dishes found in this category.</p>
                    <p className="text-xs text-slate-500 mt-1">Click &ldquo;Add New Dish&rdquo; to add items to your digital menu.</p>
                  </td>
                </tr>
              ) : (
                displayedMenu.map(dish => {
                  const cat = restCategories.find(c => c.id === dish.category_id);
                  return (
                    <tr key={dish.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setFullScreenImageItem(dish)}
                            className="relative group cursor-pointer w-11 h-11 rounded-xl overflow-hidden border border-slate-800 shrink-0"
                            title="Click to view full screen photo"
                          >
                            <SmartImage src={dish.image_url} alt={dish.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{dish.name}</div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{dish.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-300 font-medium">
                        {cat?.name || 'General / Uncategorized'}
                      </td>

                      <td className="p-4 font-bold text-white text-sm">
                        ₹{dish.price}
                      </td>

                      <td className="p-4 text-slate-400">
                        {dish.prep_time} mins
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dish.is_veg ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'}`}>
                          {dish.is_veg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleMenuItemAvailability(dish.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            dish.is_available ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {dish.is_available ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(dish)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            title="Delete Dish"
                            disabled={deletingDishId === dish.id}
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to remove "${dish.name}" from the menu?`)) {
                                setDeletingDishId(dish.id);
                                await deleteMenuItem(dish.id);
                                setDeletingDishId(null);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-50"
                          >
                            {deletingDishId === dish.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Category</h3>
            <form onSubmit={handleAddCat} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Category Name (e.g. Soups, Breads)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
                <button
                  type="submit"
                  disabled={isSavingCat}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {isSavingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingCat ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Dish Modal */}
      {showDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-bold text-white">{editingItem ? 'Edit Dish' : 'Add New Dish'}</h3>
            <form onSubmit={handleSaveDish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kadhai Paneer Special"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={dishForm.category_id}
                    onChange={(e) => setDishForm({ ...dishForm, category_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    {restCategories.length === 0 ? (
                      <option value="">General (Auto-created)</option>
                    ) : (
                      restCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients and taste notes..."
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <CompressedImageUploader
                label="Food Item Image"
                type="food"
                value={dishForm.image_url}
                onChange={(url) => {
                  setDishImageError(null);
                  setDishForm({ ...dishForm, image_url: url });
                }}
                helperText="Upload any photo — automatically compressed to 60-120 KB for blazing-fast mobile dining."
              />

              {dishImageError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{dishImageError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preparation Time (mins)</label>
                  <input
                    type="number"
                    value={dishForm.prep_time}
                    onChange={(e) => setDishForm({ ...dishForm, prep_time: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dietary Type</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={dishForm.is_veg}
                        onChange={() => setDishForm({ ...dishForm, is_veg: true })}
                        className="accent-emerald-500"
                      /> Veg
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={!dishForm.is_veg}
                        onChange={() => setDishForm({ ...dishForm, is_veg: false })}
                        className="accent-rose-500"
                      /> Non-Veg
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDishImageError(null);
                    setShowDishModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidatingImage || isSavingDish}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {isValidatingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Verifying Image...
                    </>
                  ) : isSavingDish ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Saving Dish...
                    </>
                  ) : (
                    'Save Dish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Food Image Viewer Modal */}
      <FoodImageModal
        item={fullScreenImageItem}
        onClose={() => setFullScreenImageItem(null)}
        onAction={(item) => {
          const matchedDish = restMenu.find(m => m.name === item.name);
          if (matchedDish) {
            openEditModal(matchedDish);
          }
        }}
        actionLabel="Edit This Dish"
      />
    </div>
  );
};
