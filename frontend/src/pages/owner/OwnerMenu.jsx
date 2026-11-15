import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Search,
  Building,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  fetchMyRestaurant,
  createRestaurant,
  updateRestaurant,
  addMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from '../../api/owner';
import { fetchRestaurantMenu } from '../../api/restaurants';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 8;

const OwnerMenu = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Restaurant Edit Form State
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [restName, setRestName] = useState('');
  const [restDesc, setRestDesc] = useState('');

  // Create Restaurant Form State (for new owners)
  const [newRestName, setNewRestName] = useState('');
  const [newRestDesc, setNewRestDesc] = useState('');

  // Dish Add / Edit Modal State
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');

  const loadRestaurantData = async () => {
    setLoading(true);
    setError('');
    try {
      let myRest = null;
      try {
        myRest = await fetchMyRestaurant();
        setRestaurant(myRest);
        setRestName(myRest.name);
        setRestDesc(myRest.description || '');
      } catch (e) {
        if (e.response && e.response.status === 404) {
          // Owner has no restaurant created yet
          setRestaurant(null);
          setLoading(false);
          return;
        }
        throw e;
      }

      if (myRest) {
        const menuData = await fetchRestaurantMenu(myRest.id, {
          page,
          pageSize: PAGE_SIZE,
          q: searchTerm,
        });
        setDishes(menuData.items || []);
        setTotalCount(menuData.total_count || 0);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load restaurant profile and dishes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, [page, searchTerm]);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const created = await createRestaurant({
        name: newRestName,
        description: newRestDesc,
      });
      setRestaurant(created);
      setNotification('Restaurant created successfully! You can now add dishes to your menu.');
      loadRestaurantData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create restaurant.');
    }
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateRestaurant(restaurant.id, {
        name: restName,
        description: restDesc,
      });
      setRestaurant(updated);
      setEditingRestaurant(false);
      setNotification('Restaurant details updated successfully.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update restaurant.');
    }
  };

  const handleOpenDishModal = (dish = null) => {
    if (dish) {
      setEditingDishId(dish.id);
      setDishName(dish.name);
      setDishDesc(dish.description || '');
      setDishPrice(dish.price);
    } else {
      setEditingDishId(null);
      setDishName('');
      setDishDesc('');
      setDishPrice('');
    }
    setDishModalOpen(true);
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    try {
      if (editingDishId) {
        await updateMenuItem(editingDishId, {
          name: dishName,
          description: dishDesc,
          price: dishPrice,
        });
        setNotification(`Dish "${dishName}" updated successfully.`);
      } else {
        await addMenuItem(restaurant.id, {
          name: dishName,
          description: dishDesc,
          price: dishPrice,
        });
        setNotification(`Dish "${dishName}" added to the menu.`);
      }
      setDishModalOpen(false);
      loadRestaurantData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save menu item.');
    }
  };

  const handleToggleAvailability = async (dish) => {
    try {
      await toggleMenuItemAvailability(dish.id, !dish.is_available);
      loadRestaurantData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update dish availability.');
    }
  };

  const handleDeleteDish = async (dish) => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${dish.name}"? If it was included in past orders, it will be hidden from customer menus (soft-deleted) rather than permanently wiped.`
    );
    if (!confirm) return;

    try {
      const resp = await deleteMenuItem(dish.id);
      if (resp.status === 'soft_deleted') {
        alert(
          `Notice: "${dish.name}" was included in past student orders, so it was marked unavailable (soft-deleted) to protect historical order receipts.`
        );
      } else {
        setNotification(`Dish "${dish.name}" deleted permanently.`);
      }
      loadRestaurantData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete dish.');
    }
  };

  if (loading) return <Loader message="Loading menu & kitchen inventory..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadRestaurantData} />;

  // 1. If Owner has no restaurant registered yet
  if (!restaurant) {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '540px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <Building size={48} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
          <h2>Register Your Campus Kitchen</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
            Each restaurant owner can manage one campus kitchen stall. Provide your stall name and details to begin.
          </p>

          <form onSubmit={handleCreateRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', textAlign: 'left' }}>
            <div>
              <label htmlFor="create-rest-name">Restaurant / Stall Name</label>
              <input
                id="create-rest-name"
                type="text"
                required
                placeholder="e.g. North Hall Curry & Grill"
                value={newRestName}
                onChange={(e) => setNewRestName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="create-rest-desc">Description</label>
              <textarea
                id="create-rest-desc"
                rows={3}
                placeholder="Describe your cuisines, specialty dishes, and campus location..."
                value={newRestDesc}
                onChange={(e) => setNewRestDesc(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Create Restaurant Stall
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Active Restaurant Menu Management View
  return (
    <div className="container page-wrapper">
      {/* Alert notification */}
      {notification && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-success-surface)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-success)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Restaurant Info & Edit Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        {editingRestaurant ? (
          <form onSubmit={handleSaveRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>Edit Restaurant Information</h3>
            <div>
              <label htmlFor="edit-rest-name">Restaurant Name</label>
              <input
                id="edit-rest-name"
                type="text"
                required
                value={restName}
                onChange={(e) => setRestName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-rest-desc">Description</label>
              <textarea
                id="edit-rest-desc"
                rows={2}
                value={restDesc}
                onChange={(e) => setRestDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn-primary btn-sm">
                Save Changes
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setEditingRestaurant(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                <h1 style={{ fontSize: 'var(--font-size-xl)' }}>{restaurant.name}</h1>
                <span style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                  Kitchen #{restaurant.id}
                </span>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {restaurant.description || 'No description provided.'}
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setEditingRestaurant(true)}
            >
              <Edit2 size={14} /> Edit Details
            </button>
          </div>
        )}
      </div>

      {/* Menu Header & Search / Add Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search dishes by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{ paddingLeft: 'var(--space-8)' }}
          />
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => handleOpenDishModal(null)}
        >
          <Plus size={16} /> Add New Dish
        </button>
      </div>

      {/* Dishes Table */}
      {dishes.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items"
          description={searchTerm ? `No dishes found matching "${searchTerm}".` : 'Your menu is currently empty. Click "Add New Dish" to create your first item.'}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Dish Name</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Price</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Availability</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => (
                  <tr
                    key={dish.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: dish.is_available ? 'var(--color-bg-surface)' : 'var(--color-bg-page)',
                      opacity: dish.is_available ? 1 : 0.75,
                    }}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <strong style={{ display: 'block' }}>{dish.name}</strong>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {dish.description || 'No description'}
                      </span>
                    </td>

                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-primary)' }}>
                      ${Number(dish.price).toFixed(2)}
                    </td>

                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(dish)}
                        className="btn-secondary btn-sm"
                        style={{
                          backgroundColor: dish.is_available ? 'var(--color-success-surface)' : 'var(--color-border-subtle)',
                          color: dish.is_available ? 'var(--color-success)' : 'var(--color-text-muted)',
                          borderColor: dish.is_available ? 'var(--color-success-border)' : 'var(--color-border)',
                          cursor: 'pointer',
                        }}
                      >
                        {dish.is_available ? (
                          <>
                            <Eye size={14} /> Available
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} /> Unavailable
                          </>
                        )}
                      </button>
                    </td>

                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => handleOpenDishModal(dish)}
                          title="Edit Dish"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => handleDeleteDish(dish)}
                          title="Delete Dish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Add / Edit Dish Modal */}
      {dishModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(35, 31, 28, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 'var(--space-4)',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '460px', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3>{editingDishId ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button
                type="button"
                onClick={() => setDishModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="dish-modal-name">Dish Name</label>
                <input
                  id="dish-modal-name"
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa or Veggie Burger"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="dish-modal-price">Price ($)</label>
                <input
                  id="dish-modal-price"
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  placeholder="e.g. 8.50"
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="dish-modal-desc">Description</label>
                <textarea
                  id="dish-modal-desc"
                  rows={2}
                  placeholder="Ingredients, preparation notes, allergen info..."
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDishModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDishId ? 'Save Changes' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerMenu;
