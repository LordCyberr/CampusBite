import React, { useState } from 'react';
import { Plus, Minus, Star, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const DISH_THUMBNAILS = {
  chai: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
  maggi: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&auto=format&fit=crop&q=80',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80',
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80',
  roll: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=80',
  thali: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&auto=format&fit=crop&q=80',
  lassi: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&auto=format&fit=crop&q=80',
  gulabjamun: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80',
  fries: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&auto=format&fit=crop&q=80',
  drink: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&auto=format&fit=crop&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80',
  dessert: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
};

const DishCard = ({ dish, restaurantId, restaurantName }) => {
  const { items, addItem, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const [imgError, setImgError] = useState(false);

  // Find if this dish is already in the customer's cart
  const cartItem = items.find((i) => i.menu_item_id === dish.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  // Smart Veg / Non-Veg detection
  const textCombined = `${dish.name} ${dish.description || ''}`.toLowerCase();
  const isNonVeg = /chicken|meat|beef|pork|bacon|pepperoni|fish|mutton|prawn|egg|tuna|sausage/i.test(
    textCombined
  );

  // Bestseller highlight
  const isBestseller = /special|signature|bestseller|supreme|chef|deluxe|paneer|butter|maggi|biryani|dosa|thali/i.test(
    textCombined
  );

  // Select matching image thumbnail
  const getDishImage = () => {
    if (/chai|tea|kadak/i.test(textCombined)) return DISH_THUMBNAILS.chai;
    if (/maggi|noodle/i.test(textCombined)) return DISH_THUMBNAILS.maggi;
    if (/dosa|idli|vada|uttapam/i.test(textCombined)) return DISH_THUMBNAILS.dosa;
    if (/biryani|pulao/i.test(textCombined)) return DISH_THUMBNAILS.biryani;
    if (/samosa|pakora|kachori/i.test(textCombined)) return DISH_THUMBNAILS.samosa;
    if (/roll|kathi|frankie|wrap/i.test(textCombined)) return DISH_THUMBNAILS.roll;
    if (/thali|chole|rajma/i.test(textCombined)) return DISH_THUMBNAILS.thali;
    if (/lassi|shake|smoothie/i.test(textCombined)) return DISH_THUMBNAILS.lassi;
    if (/gulab|jamun|sweet|mithai|halwa|kulfi/i.test(textCombined)) return DISH_THUMBNAILS.gulabjamun;
    if (/pizza|margherita|pepperoni/i.test(textCombined)) return DISH_THUMBNAILS.pizza;
    if (/burger|patty|whopper|slider/i.test(textCombined)) return DISH_THUMBNAILS.burger;
    if (/curry|dal|paneer|masala|rice|roti|naan/i.test(textCombined)) return DISH_THUMBNAILS.curry;
    if (/sandwich|toast|bun\s*maska/i.test(textCombined)) return DISH_THUMBNAILS.sandwich;
    if (/fries|finger|nugget|snack|chips|crispy/i.test(textCombined)) return DISH_THUMBNAILS.fries;
    if (/drink|coffee|beverage|soda/i.test(textCombined)) return DISH_THUMBNAILS.drink;
    if (/dessert|cake|brownie|ice\s*cream|pastry/i.test(textCombined)) return DISH_THUMBNAILS.dessert;
    return DISH_THUMBNAILS.default;
  };

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
      className={`dish-card-horizontal ${inCartQty > 0 ? 'in-cart' : ''}`}
      style={{
        opacity: dish.is_available ? 1 : 0.65,
      }}
    >
      {/* Left Column: Dish details, badges, dual price */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Veg / Non-Veg badge + Bestseller chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              className={isNonVeg ? 'nonveg-badge' : 'veg-badge'}
              title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
            />
            {isBestseller && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  backgroundColor: 'rgba(255, 79, 24, 0.1)',
                  color: 'var(--color-primary)',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                <Sparkles size={10} /> Bestseller
              </span>
            )}
          </div>

          {/* Dish Name */}
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '4px',
              lineHeight: 1.3,
            }}
          >
            {dish.name}
          </h4>

          {/* Price with Dual Currency Display */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              marginBottom: '6px',
              fontFamily: 'var(--font-headings)',
            }}
          >
            {formatPrice(dish.price)}
          </div>

          {/* Star rating pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#D97706', fontWeight: 700, marginBottom: '8px' }}>
            <Star size={12} fill="#F59E0B" color="#F59E0B" />
            <span>4.7 (30+)</span>
          </div>

          {/* Dish Description */}
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {dish.description || 'Prepared fresh on order with high quality campus-approved ingredients.'}
          </p>
        </div>
      </div>

      {/* Right Column: Visual Food Thumbnail with Zomato/Swiggy Overlapping Button */}
      <div className="dish-media-wrapper">
        {!imgError ? (
          <img
            src={getDishImage()}
            alt={dish.name}
            onError={() => setImgError(true)}
            className="dish-media-img"
            loading="lazy"
          />
        ) : (
          <div
            className="dish-media-img"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(255, 79, 24, 0.1) 0%, rgba(255, 158, 44, 0.15) 100%)',
              color: 'var(--color-primary)',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            🍽️
          </div>
        )}

        {/* Floating Stepper or ADD Button Overlapping Image Bottom */}
        <div className="dish-floating-action">
          {dish.is_available ? (
            inCartQty > 0 ? (
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
                padding: '3px 8px',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Sold Out
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCard;
