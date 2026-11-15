import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

const DishCard = ({ dish, restaurantId, restaurantName }) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();

  const handleAdd = () => {
    if (!dish.is_available) return;
    const added = addItem(dish, restaurantId, restaurantName, quantity);
    if (added) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
      setQuantity(1); // Reset counter
    }
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: dish.is_available ? 1 : 0.7,
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <h4 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
            {dish.name}
          </h4>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-md)',
              whiteSpace: 'nowrap',
            }}
          >
            ${Number(dish.price).toFixed(2)}
          </span>
        </div>

        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-4)',
            minHeight: '38px',
          }}
        >
          {dish.description || 'Prepared fresh daily by kitchen chefs.'}
        </p>
      </div>

      <div>
        {dish.is_available ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            {/* Quantity Stepper */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-bg-page)',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: 'var(--space-2)',
                  border: 'none',
                  background: 'transparent',
                }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease Quantity"
              >
                <Minus size={14} />
              </button>
              <span
                style={{
                  padding: '0 var(--space-2)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  minWidth: '24px',
                  textAlign: 'center',
                }}
              >
                {quantity}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: 'var(--space-2)',
                  border: 'none',
                  background: 'transparent',
                }}
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase Quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add Button */}
            <button
              type="button"
              className={justAdded ? 'btn-secondary' : 'btn-primary'}
              style={{
                flex: 1,
                backgroundColor: justAdded ? 'var(--color-success-surface)' : undefined,
                color: justAdded ? 'var(--color-success)' : undefined,
                borderColor: justAdded ? 'var(--color-success-border)' : undefined,
              }}
              onClick={handleAdd}
            >
              {justAdded ? (
                <>
                  <Check size={16} /> Added!
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> Add to Cart
                </>
              )}
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-border-subtle)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Currently Unavailable
          </div>
        )}
      </div>
    </div>
  );
};

export default DishCard;
