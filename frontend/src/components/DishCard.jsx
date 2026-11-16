import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const DishCard = ({ dish, restaurantId, restaurantName }) => {
  const { items, addItem, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();

  // Find if this dish is already in the customer's cart
  const cartItem = items.find((i) => i.menu_item_id === dish.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  // Smart Veg / Non-Veg detection
  const isNonVeg = /chicken|meat|beef|pork|bacon|pepperoni|fish|mutton|prawn/i.test(
    `${dish.name} ${dish.description || ''}`
  );

  const handleAddFirst = () => {
    if (!dish.is_available) return;
    addItem(dish, restaurantId, restaurantName, 1);
  };

  const handleIncrement = () => {
    updateQuantity(dish.id, inCartQty + 1);
  };

  const handleDecrement = () => {
    updateQuantity(dish.id, inCartQty - 1);
  };

  return (
    <div
      className="card card-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: dish.is_available ? 1 : 0.65,
        position: 'relative',
        borderRadius: 'var(--radius)',
        border: inCartQty > 0 ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
        boxShadow: inCartQty > 0 ? '0 4px 16px rgba(255, 79, 24, 0.12)' : undefined,
      }}
    >
      <div>
        {/* Header: Veg/Non-Veg icon & Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={isNonVeg ? 'nonveg-badge' : 'veg-badge'} title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {dish.name}
            </h4>
          </div>
          <span
            style={{
              fontWeight: 800,
              color: 'var(--color-primary)',
              fontSize: '15px',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-headings)',
            }}
          >
            {formatPrice(dish.price)}
          </span>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.45,
            minHeight: '36px',
          }}
        >
          {dish.description || 'Prepared fresh upon order with quality ingredients.'}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '8px' }}>
        {dish.is_available ? (
          inCartQty > 0 ? (
            /* Swiggy Stepper when already in cart */
            <div className="swiggy-stepper">
              <button type="button" onClick={handleDecrement} aria-label="Decrease Quantity">
                <Minus size={13} />
              </button>
              <span>{inCartQty}</span>
              <button type="button" onClick={handleIncrement} aria-label="Increase Quantity">
                <Plus size={13} />
              </button>
            </div>
          ) : (
            /* Swiggy ADD Button */
            <button
              type="button"
              className="btn-swiggy-add"
              onClick={handleAddFirst}
              aria-label={`Add ${dish.name} to Cart`}
            >
              ADD +
            </button>
          )
        ) : (
          <div
            style={{
              padding: '4px 12px',
              background: 'var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Sold Out
          </div>
        )}
      </div>
    </div>
  );
};

export default DishCard;
