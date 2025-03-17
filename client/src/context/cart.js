import { createContext, useContext, useReducer, useEffect } from "react";

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const { slug } = action.payload;
      return {
        ...state,
        [slug]: state[slug]
          ? { quantity: state[slug].quantity + 1 }
          : { quantity: 1 },
      };
    }
    case "REMOVE_FROM_CART": {
      const newState = { ...state };
      delete newState[action.payload.slug];
      return newState;
    }
    case "UPDATE_QUANTITY": {
      const { slug, quantity } = action.payload;
      if (quantity <= 0) {
        const newState = { ...state };
        delete newState[slug];
        return newState;
      }
      return {
        ...state,
        [slug]: { ...state[slug], quantity },
      };
    }
    case "CLEAR_CART":
      return {};
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, {}, () => {
    const localData = localStorage.getItem("cart");
    return localData ? JSON.parse(localData) : {};
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (slug) => {
    console.log(slug);
    dispatch({ type: "ADD_TO_CART", payload: { slug } });
  };

  const removeFromCart = (slug) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: { slug } });
  };

  const updateQuantity = (slug, quantity) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { slug, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
