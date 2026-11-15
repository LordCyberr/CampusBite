import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartState, setCartState] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbite_cart');
      return saved ? JSON.parse(saved) : { restaurantId: null, restaurantName: '', items: [] };
    } catch {
      return { restaurantId: null, restaurantName: '', items: [] };
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('campusbite_cart', JSON.stringify(cartState));
  }, [cartState]);

  /**
   * Adds an item to the cart.
   * If item belongs to a different restaurant, prompts the user to confirm clearing existing cart.
   */
  const addItem = (item, restaurantId, restaurantName, quantity = 1) => {
    if (cartState.restaurantId && cartState.restaurantId !== restaurantId && cartState.items.length > 0) {
      const confirmClear = window.confirm(
        `Your cart already contains items from "${cartState.restaurantName || 'another restaurant'}". Would you like to clear your cart and start a new order from "${restaurantName}"?`
      );
      if (!confirmClear) return false;

      // User agreed to reset cart for new restaurant
      setCartState({
        restaurantId,
        restaurantName,
        items: [{
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity,
        }],
      });
      return true;
    }

    setCartState((prev) => {
      const existingIdx = prev.items.findIndex((i) => i.menu_item_id === item.id);
      let updatedItems;

      if (existingIdx >= 0) {
        updatedItems = [...prev.items];
        updatedItems[existingIdx].quantity += quantity;
      } else {
        updatedItems = [
          ...prev.items,
          {
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity,
          },
        ];
      }

      return {
        restaurantId,
        restaurantName: restaurantName || prev.restaurantName,
        items: updatedItems,
      };
    });
    return true;
  };

  const updateQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setCartState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.menu_item_id === menuItemId ? { ...i, quantity: newQuantity } : i
      ),
    }));
  };

  const removeItem = (menuItemId) => {
    setCartState((prev) => {
      const updated = prev.items.filter((i) => i.menu_item_id !== menuItemId);
      return {
        restaurantId: updated.length === 0 ? null : prev.restaurantId,
        restaurantName: updated.length === 0 ? '' : prev.restaurantName,
        items: updated,
      };
    });
  };

  const clearCart = () => {
    setCartState({ restaurantId: null, restaurantName: '', items: [] });
    localStorage.removeItem('campusbite_cart');
  };

  // Running total calculation (For display only; server is sole authority for final total)
  const totalAmount = cartState.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    restaurantId: cartState.restaurantId,
    restaurantName: cartState.restaurantName,
    items: cartState.items,
    totalCount,
    totalAmount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
